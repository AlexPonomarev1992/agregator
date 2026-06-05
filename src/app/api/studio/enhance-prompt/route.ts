import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { enhancePrompt } from "@/lib/api/prompt-enhance"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON", 400)
  }

  const { prompt, mode } = body as { prompt?: string; mode?: string }
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return apiError("VALIDATION_ERROR", "prompt обязателен", 400)
  }

  try {
    const enhanced = await enhancePrompt(prompt.trim(), (mode as "photo") ?? "photo")
    return apiSuccess({ prompt: enhanced })
  } catch (error) {
    console.error("[studio/enhance-prompt]", error)
    return apiError("INTERNAL_ERROR", "Не удалось улучшить промпт", 500)
  }
}
