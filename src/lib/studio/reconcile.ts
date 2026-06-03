/**
 * Серверная реконсиляция генераций с KIE.
 *
 * Проблема: статус running→succeeded/failed раньше проставлялся ТОЛЬКО при
 * поллинге клиентом. Если вкладка закрыта/телефон выключен — задача висела
 * вечно. Здесь — общий код, который:
 *   - дергает статус задачи у KIE (fetchKieStatus),
 *   - финализирует генерацию в БД (finalizeGeneration) с уведомлением,
 *   - и фоновый свип (reconcileRunningGenerations) — не зависит от клиента.
 */

import { and, inArray, isNotNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { generations } from "@/lib/db/schema"
import type { SelectGeneration } from "@/lib/db/schema"
import { updateGenerationStatus } from "@/lib/db/queries/studio"
import { logGenerationError } from "@/lib/db/queries/generation-errors"
import { refundCredits } from "@/lib/studio/credits"
import { checkAndAwardBadges } from "@/lib/services/badges"
import { notify } from "@/lib/services/notify"
import { GENERATION_ERROR_CODES, getErrorMessage } from "@/lib/studio/generation-error-codes"

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY
const KIE_API_URL = "https://api.kie.ai"

/** Задача, дольше этого висящая в running без результата, помечается timeout. */
const HARD_TIMEOUT_MS = 20 * 60 * 1000

interface KieStatusData {
  state: string
  resultJson?: string
  failMsg?: string
  progress?: number
}
interface KieStatusResponse {
  code: number
  msg?: string
  data?: KieStatusData
}

export interface KieResult {
  status: string
  resultUrls?: string[]
  thumbnailUrl?: string
  errorMessage?: string
}

function pickUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim()
    return /^https?:\/\//i.test(trimmed) ? trimmed : undefined
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>
    for (const k of ["url", "videoUrl", "video_url", "originUrl", "origin_url"]) {
      const u = pickUrl(obj[k])
      if (u) return u
    }
  }
  return undefined
}

function extractMediaUrls(result: Record<string, unknown>): string[] {
  const candidates: unknown[] = []
  for (const key of ["resultUrls", "urls", "videoUrls", "video_urls"]) {
    const v = result[key]
    if (Array.isArray(v)) candidates.push(...v)
  }
  for (const key of ["url", "videoUrl", "video_url", "originUrl", "origin_url"]) {
    if (result[key] !== undefined) candidates.push(result[key])
  }
  const urls: string[] = []
  for (const c of candidates) {
    const u = pickUrl(c)
    if (u) urls.push(u)
  }
  return Array.from(new Set(urls))
}

function extractThumbnailUrl(result: Record<string, unknown>): string | undefined {
  for (const key of ["thumbnailUrl", "thumbnail_url", "coverUrl", "cover_url", "cover"]) {
    const u = pickUrl(result[key])
    if (u) return u
  }
  return undefined
}

/** Запрашивает статус задачи у KIE (recordInfo). */
export async function fetchKieStatus(taskId: string): Promise<KieResult> {
  if (!KIE_API_KEY) {
    return { status: "succeeded", resultUrls: [`https://picsum.photos/800/600?t=${taskId}`] }
  }

  const response = await fetch(
    `${KIE_API_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    { headers: { Authorization: `Bearer ${KIE_API_KEY}` }, cache: "no-store" }
  )
  const data: KieStatusResponse = await response.json()
  if (data.code !== 200 || !data.data) {
    throw new Error(`KIE API error: ${data.msg ?? `code ${data.code}`}`)
  }

  const task = data.data
  const stateMap: Record<string, string> = {
    waiting: "running",
    queuing: "running",
    generating: "running",
    success: "succeeded",
    fail: "failed",
  }
  let status = stateMap[task.state] ?? "running"
  let resultUrls: string[] | undefined
  let thumbnailUrl: string | undefined

  if (status === "succeeded" && task.resultJson) {
    try {
      const result = JSON.parse(task.resultJson) as Record<string, unknown>
      resultUrls = extractMediaUrls(result)
      thumbnailUrl = extractThumbnailUrl(result) ?? resultUrls[0]
    } catch {
      console.warn("[reconcile] Failed to parse resultJson:", task.resultJson)
    }
    // KIE может вернуть success раньше, чем файл доступен — ждём следующий проход.
    if (!resultUrls || resultUrls.length === 0) {
      status = "running"
      resultUrls = undefined
      thumbnailUrl = undefined
    }
  }

  return { status, resultUrls, thumbnailUrl, errorMessage: task.failMsg }
}

/**
 * Финализирует генерацию по результату KIE (terminal статус): пишет статус,
 * логирует ошибку, выдаёт бейджи и шлёт уведомление. Возвращает обновлённую строку.
 */
export async function finalizeGeneration(
  generation: SelectGeneration,
  kieResult: KieResult
): Promise<SelectGeneration> {
  const startedAt = generation.createdAt?.getTime() ?? Date.now()
  const durationMs = Date.now() - startedAt

  let errorCode: string | undefined
  let errorMessage: string | undefined

  if (kieResult.status === "failed") {
    const raw = kieResult.errorMessage ?? ""
    const low = raw.toLowerCase()
    if (low.includes("content") || low.includes("policy")) {
      errorCode = GENERATION_ERROR_CODES.CONTENT_POLICY
    } else if (low.includes("prompt") && low.includes("long")) {
      errorCode = GENERATION_ERROR_CODES.PROMPT_TOO_LONG
    } else {
      errorCode = GENERATION_ERROR_CODES.PROVIDER_FAILED
    }
    errorMessage = getErrorMessage(errorCode)
    await logGenerationError({
      generationId: generation.id,
      userId: generation.userId,
      stage: "poll",
      errorCode,
      errorMessage: `${errorMessage} | provider: ${raw}`,
      rawResponse: { failMsg: raw, kieTaskId: generation.kieTaskId },
    })
  }

  const updated = await updateGenerationStatus(generation.id, {
    status: kieResult.status,
    resultUrls: kieResult.resultUrls,
    thumbnailUrl: kieResult.thumbnailUrl,
    errorMessage,
    errorCode,
    durationMs,
  })

  if (kieResult.status === "succeeded") {
    checkAndAwardBadges(generation.userId).catch((err) =>
      console.error("[reconcile] Badge check error:", err)
    )
    notify.generationDone(
      generation.userId,
      "video",
      String((generation.parameters as Record<string, unknown>)?.prompt ?? ""),
      generation.id
    )
  }

  return updated
}

/**
 * Сверяет одну running-генерацию с KIE. Возвращает актуальную строку.
 * Используется и точечно (status route), и в фоновом свипе.
 */
export async function reconcileGeneration(
  generation: SelectGeneration
): Promise<SelectGeneration> {
  if (generation.status !== "running" || !generation.kieTaskId) return generation

  try {
    const kieResult = await fetchKieStatus(generation.kieTaskId)
    if (kieResult.status !== "running") {
      return await finalizeGeneration(generation, kieResult)
    }
  } catch (error) {
    const rawMsg = error instanceof Error ? error.message : String(error)
    await logGenerationError({
      generationId: generation.id,
      userId: generation.userId,
      stage: "poll",
      errorCode: GENERATION_ERROR_CODES.POLL_FAILED,
      errorMessage: getErrorMessage(GENERATION_ERROR_CODES.POLL_FAILED),
      rawResponse: { message: rawMsg },
    })
  }

  // Висит слишком долго → timeout + возврат кредитов (освобождаем слот очереди).
  const age = Date.now() - (generation.createdAt?.getTime() ?? Date.now())
  if (age > HARD_TIMEOUT_MS) {
    const updated = await updateGenerationStatus(generation.id, {
      status: "failed",
      errorCode: GENERATION_ERROR_CODES.POLL_TIMEOUT,
      errorMessage: getErrorMessage(GENERATION_ERROR_CODES.POLL_TIMEOUT),
    })
    await refundCredits(
      generation.userId,
      generation.costCredits,
      `Refund: generation ${generation.id} timed out`
    )
    return updated
  }

  return generation
}

/**
 * Фоновый свип: реконсилит все running-генерации с kieTaskId.
 * Вызывается из крон-эндпоинта — не зависит от того, открыт ли клиент.
 */
export async function reconcileRunningGenerations(
  limit = 100
): Promise<{ checked: number; finalized: number }> {
  const rows = await db.query.generations.findMany({
    where: and(
      inArray(generations.status, ["queued", "running"]),
      isNotNull(generations.kieTaskId)
    ),
    orderBy: generations.createdAt,
    limit,
  })

  let finalized = 0
  for (const gen of rows) {
    try {
      const updated = await reconcileGeneration(gen)
      if (updated.status !== gen.status) finalized++
    } catch (err) {
      console.error(`[reconcile] gen ${gen.id} failed:`, err)
    }
  }
  return { checked: rows.length, finalized }
}
