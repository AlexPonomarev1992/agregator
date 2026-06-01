import { db } from "../index"
import { generationErrors } from "../schema"
import type { InsertGenerationError } from "../schema"
import { isRetryable } from "@/lib/studio/generation-error-codes"

/**
 * Записать ошибку генерации в журнал.
 * Fire-and-forget — никогда не бросает исключение, чтобы не перебивать основной поток.
 */
export async function logGenerationError(
  data: Omit<InsertGenerationError, "id" | "createdAt" | "retryable"> & { retryable?: boolean }
): Promise<void> {
  try {
    await db.insert(generationErrors).values({
      ...data,
      retryable: data.retryable ?? isRetryable(data.errorCode),
    })
  } catch (err) {
    console.error("[logGenerationError] Failed to write error log:", err)
  }
}
