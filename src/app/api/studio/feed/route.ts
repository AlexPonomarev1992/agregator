import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { getGenerationsByUser } from "@/lib/db/queries/studio"
import { getModel } from "@/lib/models/registry"
import type { ModelCategory } from "@/lib/models/types"

const CATEGORY_TYPES: Record<string, ModelCategory> = {
  video: "video",
  image: "image",
  audio: "audio",
  music: "music",
}

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const { userId } = authResult

  const { searchParams } = new URL(request.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50))
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0)
  const modelSlug = searchParams.get("modelSlug") ?? undefined
  const categoryParam = searchParams.get("category") ?? undefined

  const filterCategory: ModelCategory | undefined =
    categoryParam && categoryParam in CATEGORY_TYPES
      ? CATEGORY_TYPES[categoryParam]
      : undefined

  try {
    const items = await getGenerationsByUser(userId, { limit, offset, modelId: modelSlug })

    // Filter by category in JS (model registry lookup)
    const filtered = filterCategory
      ? items.filter((gen) => {
          const m = gen.modelId ? getModel(gen.modelId) : undefined
          return m?.category === filterCategory
        })
      : items

    return apiSuccess(
      {
        items: filtered,
        total: filtered.length,
        hasMore: items.length === limit,
      },
      { page: Math.floor(offset / limit) + 1, total: filtered.length }
    )
  } catch (error) {
    console.error("[studio/feed] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка получения ленты", 500)
  }
}
