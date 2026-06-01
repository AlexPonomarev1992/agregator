import { eq, and, lt, desc, sql } from "drizzle-orm"
import { db } from "../index"
import {
  generations,
  type SelectGeneration,
  type InsertGeneration,
} from "../schema"

/** Создать новую запись генерации */
export async function createGeneration(
  data: InsertGeneration
): Promise<SelectGeneration> {
  try {
    const [generation] = await db
      .insert(generations)
      .values(data)
      .returning()

    return generation
  } catch (error) {
    console.error("[createGeneration] Error:", error)
    throw error
  }
}

/** Получить генерацию по ID */
export async function getGenerationById(
  id: string
): Promise<SelectGeneration | null> {
  try {
    const result = await db.query.generations.findFirst({
      where: eq(generations.id, id),
    })

    return result ?? null
  } catch (error) {
    console.error("[getGenerationById] Error:", error)
    throw error
  }
}

/** Получить генерации пользователя с пагинацией (новые первыми) */
export async function getGenerationsByUser(
  userId: string,
  page: number = 1,
  limit: number = 20,
  type?: "video" | "photo"
): Promise<{ data: SelectGeneration[]; total: number }> {
  try {
    const offset = (page - 1) * limit
    const whereClause = type
      ? and(eq(generations.userId, userId), eq(generations.type, type))
      : eq(generations.userId, userId)

    const [data, countResult] = await Promise.all([
      db.query.generations.findMany({
        where: whereClause,
        orderBy: desc(generations.createdAt),
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(generations)
        .where(whereClause),
    ])

    return {
      data,
      total: countResult[0].count,
    }
  } catch (error) {
    console.error("[getGenerationsByUser] Error:", error)
    throw error
  }
}

/** Удалить генерации старше указанного количества дней */
export async function deleteOldGenerations(days: number = 14): Promise<number> {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)

    const result = await db
      .delete(generations)
      .where(lt(generations.createdAt, cutoff))
      .returning({ id: generations.id })

    console.log(`[deleteOldGenerations] Deleted ${result.length} generations older than ${days} days`)
    return result.length
  } catch (error) {
    console.error("[deleteOldGenerations] Error:", error)
    throw error
  }
}

/** Обновить статус генерации */
export async function updateGenerationStatus(
  id: string,
  status: "pending" | "processing" | "done" | "failed",
  resultUrl?: string,
  metadata?: Record<string, unknown>
): Promise<SelectGeneration> {
  try {
    const [updated] = await db
      .update(generations)
      .set({
        status,
        ...(resultUrl !== undefined ? { resultUrl } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
      })
      .where(eq(generations.id, id))
      .returning()

    if (!updated) {
      throw new Error(`Generation not found: ${id}`)
    }

    return updated
  } catch (error) {
    console.error("[updateGenerationStatus] Error:", error)
    throw error
  }
}
