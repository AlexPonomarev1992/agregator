import { eq, and, inArray, desc, gt } from "drizzle-orm"
import { db } from "../index"
import {
  generations,
  modelPresets,
  type SelectGeneration,
  type InsertGeneration,
  type SelectModelPreset,
  type InsertModelPreset,
} from "../schema"

// ---------------------------------------------------------------------------
// Generation helpers
// ---------------------------------------------------------------------------

type ActiveStatus = "queued" | "running"

interface GetGenerationsOptions {
  limit?: number
  offset?: number
  modelId?: string
}

export async function getGenerationsByUser(
  userId: string,
  options: GetGenerationsOptions = {}
): Promise<SelectGeneration[]> {
  const { limit = 50, offset = 0, modelId } = options
  try {
    return await db.query.generations.findMany({
      where: modelId
        ? and(
            eq(generations.userId, userId),
            eq(generations.modelId, modelId)
          )
        : eq(generations.userId, userId),
      orderBy: desc(generations.createdAt),
      limit,
      offset,
    })
  } catch (error) {
    console.error("[studio.getGenerationsByUser] Error:", error)
    throw error
  }
}

export async function getGenerationById(
  id: string,
  userId: string
): Promise<SelectGeneration | null> {
  try {
    const result = await db.query.generations.findFirst({
      where: and(eq(generations.id, id), eq(generations.userId, userId)),
    })
    return result ?? null
  } catch (error) {
    console.error("[studio.getGenerationById] Error:", error)
    throw error
  }
}

export async function getActiveJobsByUser(
  userId: string
): Promise<SelectGeneration[]> {
  try {
    return await db.query.generations.findMany({
      where: and(
        eq(generations.userId, userId),
        inArray(generations.status, ["queued", "running"] as ActiveStatus[])
      ),
      orderBy: desc(generations.createdAt),
    })
  } catch (error) {
    console.error("[studio.getActiveJobsByUser] Error:", error)
    throw error
  }
}

/**
 * Активной задачей для лимита параллельных генераций считаем только СВЕЖИЕ
 * queued/running. Статус обновляется лишь при поллинге клиентом, фонового
 * досмотра нет — поэтому брошенные задачи (закрытая вкладка, таймаут поллинга)
 * вечно висят в running и навсегда забивают лимит. Отсекаем всё старше порога:
 * реальная генерация на KIE укладывается в минуты.
 */
const ACTIVE_JOB_TTL_MS = 10 * 60 * 1000 // 10 минут

export async function countActiveJobsByUser(userId: string): Promise<number> {
  try {
    const cutoff = new Date(Date.now() - ACTIVE_JOB_TTL_MS)
    const rows = await db.query.generations.findMany({
      where: and(
        eq(generations.userId, userId),
        inArray(generations.status, ["queued", "running"] as ActiveStatus[]),
        gt(generations.createdAt, cutoff)
      ),
      columns: { id: true },
    })
    return rows.length
  } catch (error) {
    console.error("[studio.countActiveJobsByUser] Error:", error)
    throw error
  }
}

export async function createGeneration(
  data: InsertGeneration
): Promise<SelectGeneration> {
  try {
    const [row] = await db.insert(generations).values(data).returning()
    return row
  } catch (error) {
    console.error("[studio.createGeneration] Error:", error)
    throw error
  }
}

interface UpdateGenerationStatusInput {
  status: string
  resultUrls?: string[]
  thumbnailUrl?: string
  errorCode?: string
  errorMessage?: string
  kieTaskId?: string
  durationMs?: number
  metadata?: Record<string, unknown>
}

export async function updateGenerationStatus(
  id: string,
  update: UpdateGenerationStatusInput
): Promise<SelectGeneration> {
  try {
    const { status, resultUrls, thumbnailUrl, errorCode, errorMessage, kieTaskId, durationMs, metadata } =
      update

    const [row] = await db
      .update(generations)
      .set({
        status,
        ...(resultUrls !== undefined ? { resultUrls } : {}),
        ...(thumbnailUrl !== undefined ? { thumbnailUrl } : {}),
        ...(errorCode !== undefined ? { errorCode } : {}),
        ...(errorMessage !== undefined ? { errorMessage } : {}),
        ...(kieTaskId !== undefined ? { kieTaskId } : {}),
        ...(durationMs !== undefined ? { durationMs } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
      })
      .where(eq(generations.id, id))
      .returning()

    if (!row) {
      throw new Error(`Generation not found: ${id}`)
    }
    return row
  } catch (error) {
    console.error("[studio.updateGenerationStatus] Error:", error)
    throw error
  }
}

// ---------------------------------------------------------------------------
// Model preset helpers
// ---------------------------------------------------------------------------

export async function getPresetsByUser(
  userId: string,
  modelId?: string
): Promise<SelectModelPreset[]> {
  try {
    return await db.query.modelPresets.findMany({
      where: modelId
        ? and(
            eq(modelPresets.userId, userId),
            eq(modelPresets.modelId, modelId)
          )
        : eq(modelPresets.userId, userId),
      orderBy: desc(modelPresets.createdAt),
    })
  } catch (error) {
    console.error("[studio.getPresetsByUser] Error:", error)
    throw error
  }
}

export async function getPresetById(
  id: string,
  userId: string
): Promise<SelectModelPreset | null> {
  try {
    const result = await db.query.modelPresets.findFirst({
      where: and(eq(modelPresets.id, id), eq(modelPresets.userId, userId)),
    })
    return result ?? null
  } catch (error) {
    console.error("[studio.getPresetById] Error:", error)
    throw error
  }
}

export async function createPreset(
  data: InsertModelPreset
): Promise<SelectModelPreset> {
  try {
    const [row] = await db.insert(modelPresets).values(data).returning()
    return row
  } catch (error) {
    console.error("[studio.createPreset] Error:", error)
    throw error
  }
}

export async function updatePreset(
  id: string,
  userId: string,
  data: Partial<
    Pick<
      InsertModelPreset,
      "name" | "parameters" | "thumbnailUrl" | "mode" | "modelId"
    >
  >
): Promise<SelectModelPreset> {
  try {
    const [row] = await db
      .update(modelPresets)
      .set(data)
      .where(and(eq(modelPresets.id, id), eq(modelPresets.userId, userId)))
      .returning()

    if (!row) {
      throw new Error(`Preset not found or access denied: ${id}`)
    }
    return row
  } catch (error) {
    console.error("[studio.updatePreset] Error:", error)
    throw error
  }
}

export async function deletePreset(
  id: string,
  userId: string
): Promise<void> {
  try {
    await db
      .delete(modelPresets)
      .where(and(eq(modelPresets.id, id), eq(modelPresets.userId, userId)))
  } catch (error) {
    console.error("[studio.deletePreset] Error:", error)
    throw error
  }
}
