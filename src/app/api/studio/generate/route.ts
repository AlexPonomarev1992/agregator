import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { getModel } from "@/lib/models/registry"
import { buildZodSchema } from "@/lib/models/zod-builder"
import { calculatePrice } from "@/lib/models/pricing"
import { db } from "@/lib/db"
import { generations, subscriptions, userCredits } from "@/lib/db/schema"
import { chargeCredits, DEV_UNLIMITED_CREDITS } from "@/lib/studio/credits"
import { dispatchToProvider } from "@/lib/studio/dispatcher"
import { countActiveJobsByUser } from "@/lib/db/queries/studio"
import { eq, and, sql } from "drizzle-orm"

const bodySchema = z.object({
  modelSlug: z.string().min(1).max(100),
  mode: z.string().min(1).max(100),
  parameters: z.record(z.unknown()),
  parentGenerationId: z.string().uuid().optional(),
})


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

  const parsed = bodySchema.safeParse(rawBody)
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues.map((i) => i.message).join("; "), 400)
  }

  const { modelSlug, mode, parameters, parentGenerationId } = parsed.data

  // Resolve model
  const model = getModel(modelSlug)
  if (!model) {
    return apiError("MODEL_NOT_FOUND", `Модель "${modelSlug}" не найдена`, 404)
  }

  // Resolve mode
  const modeDef = model.modes.find((m) => m.id === mode)
  if (!modeDef) {
    return apiError("MODE_NOT_FOUND", `Режим "${mode}" не поддерживается моделью "${modelSlug}"`, 404)
  }

  // Validate parameters against mode schema
  const paramSchema = buildZodSchema(modeDef.parameters)
  const paramResult = paramSchema.safeParse(parameters)
  if (!paramResult.success) {
    const details = (paramResult as { success: false; error: { issues: { path: (string | number)[]; message: string }[] } }).error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ")
    return apiError("VALIDATION_ERROR", details, 400)
  }

  // Calculate price
  const cost = calculatePrice(model, parameters)

  // Determine subscription tier and limits
  let maxParallel = 3
  let priority = 0

  try {
    const activeSub = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")),
      columns: { id: true },
    })

    if (activeSub) {
      maxParallel = 6
      priority = 10
    }
  } catch (error) {
    console.error("[studio/generate] Subscription check error:", error)
  }

  // Check parallel job limit
  let activeCount: number
  try {
    activeCount = await countActiveJobsByUser(userId)
  } catch (error) {
    console.error("[studio/generate] Active jobs count error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка проверки очереди", 500)
  }

  if (activeCount >= maxParallel) {
    return apiError(
      "QUEUE_FULL",
      `Достигнут лимит параллельных задач (${maxParallel}). Дождитесь завершения текущих.`,
      429
    )
  }

  // Check credits balance
  try {
    const credits = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
      columns: { balance: true },
    })

    const balance = credits?.balance ?? 0
    if (!DEV_UNLIMITED_CREDITS && balance < cost.credits) {
      return apiError(
        "INSUFFICIENT_CREDITS",
        `Недостаточно кредитов. Требуется: ${cost.credits}, доступно: ${balance}`,
        402
      )
    }
  } catch (error) {
    console.error("[studio/generate] Credits check error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка проверки баланса", 500)
  }

  // Determine generation type for legacy field
  const genType = model.category === "video"
    ? "video"
    : model.category === "image"
    ? "photo"
    : model.category === "audio" || model.category === "music"
    ? "video" // legacy type field — not used for new generations
    : "video"

  // Atomic: charge credits + insert generation
  let generation: typeof generations.$inferSelect
  try {
    generation = await db.transaction(async (tx) => {
      await chargeCredits(
        tx,
        userId,
        cost.credits,
        `Генерация ${model.name} (${mode}): ${String(parameters.prompt ?? "").slice(0, 50)}`
      )

      const [row] = await tx
        .insert(generations)
        .values({
          userId,
          type: genType,
          status: "queued",
          prompt: String(parameters.prompt ?? ""),
          creditsSpent: cost.credits,
          provider: model.provider,
          modelId: modelSlug,
          mode,
          parameters,
          costCredits: cost.credits,
          costBreakdown: {
            base: cost.breakdown[0]?.value ?? cost.credits,
            modifiers: Object.fromEntries(
              cost.breakdown.slice(1).map((b) => [b.label, b.value])
            ),
          },
          priority,
          ...(parentGenerationId ? { parentGenerationId } : {}),
        })
        .returning()

      return row
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    if (message.includes("Insufficient credits")) {
      return apiError("INSUFFICIENT_CREDITS", "Недостаточно кредитов", 402)
    }
    console.error("[studio/generate] Transaction error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка создания генерации", 500)
  }

  // Fire-and-forget dispatch
  dispatchToProvider(generation, model).catch((err) =>
    console.error("[studio/generate] Dispatch error (fire-forget):", err)
  )

  return apiSuccess({
    generationId: generation.id,
    status: "queued",
    costCredits: cost.credits,
    costBreakdown: cost.breakdown,
  })
}
