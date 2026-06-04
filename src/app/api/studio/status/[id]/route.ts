import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError, notFound } from "@/lib/api/response"
import { getGenerationById } from "@/lib/db/queries/studio"
import { reconcileGeneration } from "@/lib/studio/reconcile"

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

  // Если ещё running с taskId — сверяем с KIE через общий реконсилятор
  // (та же логика, что и в фоновом cron-свипе).
  if (generation.status === "running" && generation.kieTaskId) {
    try {
      generation = await reconcileGeneration(generation)
    } catch (error) {
      console.error("[studio/status] Reconcile error:", error)
      // отдаём текущее состояние из БД
    }
  }

  const meta = (generation.metadata as Record<string, unknown> | null) ?? null
  return apiSuccess({
    id: generation.id,
    status: generation.status,
    resultUrls: generation.resultUrls ?? [],
    thumbnailUrl: generation.thumbnailUrl ?? null,
    errorCode: generation.errorCode ?? null,
    errorMessage: generation.errorMessage ?? null,
    lyrics: typeof meta?.lyrics === "string" ? meta.lyrics : null,
    lyricsTitle: typeof meta?.lyricsTitle === "string" ? meta.lyricsTitle : null,
  })
}
