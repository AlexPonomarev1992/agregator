import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError, notFound } from "@/lib/api/response"
import { getPresetById, updatePreset, deletePreset } from "@/lib/db/queries/studio"

const patchPresetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parameters: z.record(z.unknown()).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const { id } = await params

  try {
    const existing = await getPresetById(id, userId)
    if (!existing) return notFound("Пресет")

    await deletePreset(id, userId)
    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error("[studio/presets DELETE] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка удаления пресета", 500)
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const { id } = await params

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError("INVALID_JSON", "Тело запроса не является валидным JSON", 400)
  }

  const parsed = patchPresetSchema.safeParse(rawBody)
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400)
  }

  if (Object.keys(parsed.data).length === 0) {
    return apiError("VALIDATION_ERROR", "Нет полей для обновления", 400)
  }

  try {
    const existing = await getPresetById(id, userId)
    if (!existing) return notFound("Пресет")

    const updated = await updatePreset(id, userId, {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.parameters !== undefined ? { parameters: parsed.data.parameters } : {}),
      ...(parsed.data.thumbnailUrl !== undefined
        ? { thumbnailUrl: parsed.data.thumbnailUrl }
        : {}),
    })

    return apiSuccess(updated)
  } catch (error) {
    console.error("[studio/presets PATCH] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка обновления пресета", 500)
  }
}
