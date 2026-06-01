import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError, notFound } from "@/lib/api/response"
import { getGenerationById, updateGenerationStatus } from "@/lib/db/queries/studio"
import { logGenerationError } from "@/lib/db/queries/generation-errors"
import { checkAndAwardBadges } from "@/lib/services/badges"
import { notify } from "@/lib/services/notify"
import { GENERATION_ERROR_CODES, getErrorMessage } from "@/lib/studio/generation-error-codes"

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY
const KIE_API_URL = "https://api.kie.ai"

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

async function fetchKieStatus(
  taskId: string
): Promise<{ status: string; resultUrls?: string[]; thumbnailUrl?: string; errorMessage?: string }> {
  if (!KIE_API_KEY) {
    return {
      status: "succeeded",
      resultUrls: [`https://picsum.photos/800/600?t=${taskId}`],
    }
  }

  const response = await fetch(
    `${KIE_API_URL}/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: `Bearer ${KIE_API_KEY}` },
      cache: "no-store",
    }
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

  const status = stateMap[task.state] ?? "running"

  let resultUrls: string[] | undefined
  let thumbnailUrl: string | undefined

  if (status === "succeeded" && task.resultJson) {
    try {
      const result = JSON.parse(task.resultJson) as Record<string, unknown>
      const urls = result.resultUrls ?? result.urls
      if (Array.isArray(urls)) {
        resultUrls = urls as string[]
        thumbnailUrl = resultUrls[0]
      } else if (typeof result.url === "string") {
        resultUrls = [result.url]
        thumbnailUrl = result.url
      } else if (typeof result.video_url === "string") {
        resultUrls = [result.video_url]
        thumbnailUrl = result.video_url
      }
    } catch {
      console.warn("[studio/status] Failed to parse resultJson:", task.resultJson)
    }
  }

  return {
    status,
    resultUrls,
    thumbnailUrl,
    errorMessage: task.failMsg,
  }
}

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const { id } = await params

  let generation: Awaited<ReturnType<typeof getGenerationById>>
  try {
    generation = await getGenerationById(id, userId)
  } catch (error) {
    console.error("[studio/status] DB error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка получения статуса", 500)
  }

  if (!generation) {
    return notFound("Генерация")
  }

  // Terminal states — return immediately
  if (generation.status === "succeeded" || generation.status === "failed") {
    return apiSuccess({
      id: generation.id,
      status: generation.status,
      resultUrls: generation.resultUrls ?? [],
      thumbnailUrl: generation.thumbnailUrl ?? null,
      errorCode: generation.errorCode ?? null,
      errorMessage: generation.errorMessage ?? null,
    })
  }

  // For running jobs with a kie task ID, poll the provider
  if (generation.status === "running" && generation.kieTaskId) {
    try {
      const startedAt = generation.createdAt?.getTime() ?? Date.now()
      const kieResult = await fetchKieStatus(generation.kieTaskId)

      if (kieResult.status !== "running") {
        const durationMs = Date.now() - startedAt

        // Определяем errorCode и человекочитаемое сообщение
        let errorCode: string | undefined
        let errorMessage: string | undefined

        if (kieResult.status === "failed") {
          // Пытаемся распознать тип ошибки по сообщению провайдера
          const raw = kieResult.errorMessage ?? ""
          if (raw.toLowerCase().includes("content") || raw.toLowerCase().includes("policy")) {
            errorCode = GENERATION_ERROR_CODES.CONTENT_POLICY
          } else if (raw.toLowerCase().includes("prompt") && raw.toLowerCase().includes("long")) {
            errorCode = GENERATION_ERROR_CODES.PROMPT_TOO_LONG
          } else {
            errorCode = GENERATION_ERROR_CODES.PROVIDER_FAILED
          }
          errorMessage = getErrorMessage(errorCode)

          // Пишем в журнал ошибок
          await logGenerationError({
            generationId: generation.id,
            userId,
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
          checkAndAwardBadges(userId).catch((err) =>
            console.error("[studio/status] Badge check error:", err)
          )
          notify.generationDone(
            userId,
            "video",
            String((generation.parameters as Record<string, unknown>)?.prompt ?? ""),
            generation.id
          )
        }

        return apiSuccess({
          id: updated.id,
          status: updated.status,
          resultUrls: updated.resultUrls ?? [],
          thumbnailUrl: updated.thumbnailUrl ?? null,
          errorCode: updated.errorCode ?? null,
          errorMessage: updated.errorMessage ?? null,
        })
      }
    } catch (error) {
      console.error("[studio/status] Provider poll error:", error)

      // Логируем ошибку поллинга
      const rawMsg = error instanceof Error ? error.message : String(error)
      await logGenerationError({
        generationId: generation.id,
        userId,
        stage: "poll",
        errorCode: GENERATION_ERROR_CODES.POLL_FAILED,
        errorMessage: getErrorMessage(GENERATION_ERROR_CODES.POLL_FAILED),
        rawResponse: { message: rawMsg },
      })
      // Fall through — return current DB state
    }
  }

  return apiSuccess({
    id: generation.id,
    status: generation.status,
    resultUrls: generation.resultUrls ?? [],
    thumbnailUrl: generation.thumbnailUrl ?? null,
    errorCode: generation.errorCode ?? null,
    errorMessage: generation.errorMessage ?? null,
  })
}
