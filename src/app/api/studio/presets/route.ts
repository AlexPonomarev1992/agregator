import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { getPresetsByUser, createPreset } from "@/lib/db/queries/studio"

const createPresetSchema = z.object({
  modelSlug: z.string().min(1).max(100),
  mode: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  parameters: z.record(z.unknown()),
  thumbnailUrl: z.string().url().optional(),
})

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const { searchParams } = new URL(request.url)
  const modelSlug = searchParams.get("modelSlug") ?? undefined

  try {
    const presets = await getPresetsByUser(userId, modelSlug)
    return apiSuccess(presets)
  } catch (error) {
    console.error("[studio/presets GET] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка загрузки пресетов", 500)
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError("INVALID_JSON", "Тело запроса не является валидным JSON", 400)
  }

  const parsed = createPresetSchema.safeParse(rawBody)
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400)
  }

  const { modelSlug, mode, name, parameters, thumbnailUrl } = parsed.data

  try {
    const preset = await createPreset({
      userId,
      modelId: modelSlug,
      mode,
      name,
      parameters,
      thumbnailUrl: thumbnailUrl ?? null,
    })
    return apiSuccess(preset)
  } catch (error) {
    console.error("[studio/presets POST] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка создания пресета", 500)
  }
}
