import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { generateLyrics, editLyrics } from "@/lib/studio/lyrics"

const bodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  // Для правки: текущий текст + инструкция «что изменить».
  current: z.string().max(20000).optional(),
  instruction: z.string().max(2000).optional(),
})

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return apiError("INVALID_JSON", "Тело запроса не является валидным JSON", 400)
  }

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400)
  }

  const { prompt, current, instruction } = parsed.data

  try {
    const lyrics =
      current && instruction
        ? await editLyrics(current, instruction)
        : await generateLyrics(prompt)
    return apiSuccess({ text: lyrics.text, title: lyrics.title ?? null, style: lyrics.style ?? null })
  } catch (error) {
    console.error("[studio/lyrics] Error:", error)
    return apiError("INTERNAL_ERROR", "Не удалось сгенерировать текст песни", 500)
  }
}
