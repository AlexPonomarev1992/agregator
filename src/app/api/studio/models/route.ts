import { NextResponse } from "next/server"
import { unstable_cache } from "next/cache"
import { apiSuccess, apiError } from "@/lib/api/response"
import { getAllModels } from "@/lib/models/registry"
import { db } from "@/lib/db"
import { modelOverrides } from "@/lib/db/schema"
import type { ModelDefinition, ModelBadge } from "@/lib/models/types"

const getModelsWithOverrides = unstable_cache(
  async (): Promise<ModelDefinition[]> => {
    const models = getAllModels()

    let overrides: (typeof modelOverrides.$inferSelect)[] = []
    try {
      overrides = await db.select().from(modelOverrides)
    } catch (error) {
      console.error("[studio/models] Failed to fetch overrides:", error)
    }

    const overrideMap = new Map(overrides.map((o) => [o.modelId, o]))

    return models.map((model) => {
      const override = overrideMap.get(model.id)
      if (!override) return model

      if (override.enabled === false) return model // still return disabled, client can filter

      return {
        ...model,
        badges: override.badges ? (override.badges as ModelBadge[]) : model.badges,
        priority: override.priorityOverride != null
          ? (override.priorityOverride as 1 | 2 | 3)
          : model.priority,
        pricing: override.priceMultiplier && Number(override.priceMultiplier) !== 1
          ? {
              ...model.pricing,
              base: Math.ceil(model.pricing.base * Number(override.priceMultiplier)),
            }
          : model.pricing,
      }
    })
  },
  ["studio-models"],
  { revalidate: 60 }
)

export async function GET() {
  try {
    const models = await getModelsWithOverrides()
    return apiSuccess(models)
  } catch (error) {
    console.error("[studio/models] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка загрузки моделей", 500)
  }
}

// Allow Next.js to cache this response
export const dynamic = "force-dynamic"

// Override dynamic to enable caching via unstable_cache
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
