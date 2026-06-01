import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { validateBody } from "@/lib/api/validate";
import { generatePhotoSchema } from "@/lib/api/validation";
import {
  apiSuccess,
  apiError,
  insufficientCredits,
  externalApiError,
} from "@/lib/api/response";
import { deductCredits } from "@/lib/db/queries/credits";
import { createGeneration } from "@/lib/db/queries/generations";
import { addXp } from "@/lib/db/queries/rating";
import { checkAndAwardBadges } from "@/lib/services/badges";
import { createKieTask } from "@/lib/api/kie";
import { enhancePrompt } from "@/lib/api/prompt-enhance";

const PHOTO_CREDIT_COST = 5;

export async function POST(request: NextRequest) {
  // Проверка авторизации
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  // Валидация тела запроса
  const body = await validateBody(request, generatePhotoSchema);
  if (body instanceof NextResponse) return body;

  // Списание кредитов (атомарная проверка баланса + списание)
  try {
    await deductCredits(
      userId,
      PHOTO_CREDIT_COST,
      `Генерация фото: ${body.prompt.slice(0, 50)}...`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Insufficient credits")) {
      return insufficientCredits();
    }
    console.error("[generate/photo] Credit deduction error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка списания кредитов", 500);
  }

  // Enhance prompt before sending to KIE
  let enhancedPrompt: string;
  try {
    enhancedPrompt = await enhancePrompt(body.prompt, "photo", body.modelId, !!body.imageUrl);
  } catch {
    enhancedPrompt = body.prompt;
  }

  // Запуск задачи в KIE API
  let providerJobId: string | null = null;
  try {
    const task = await createKieTask(enhancedPrompt, "photo", body.modelId, {
      style: body.style,
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      negativePrompt: body.negativePrompt,
      renderingSpeed: body.renderingSpeed,
      imageUrl: body.imageUrl,
    });
    providerJobId = task.taskId;
  } catch (error) {
    console.error("[generate/photo] KIE API error:", error);
    const generation = await createGeneration({
      userId,
      type: "photo",
      status: "failed",
      prompt: body.prompt,
      creditsSpent: PHOTO_CREDIT_COST,
      provider: "kie",
      providerJobId: null,
      metadata: {
        style: body.style,
        templateId: body.templateId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return externalApiError(
      `Ошибка запуска генерации фото. Generation ID: ${generation.id}`
    );
  }

  // Создание записи генерации в БД
  try {
    const generation = await createGeneration({
      userId,
      type: "photo",
      status: "pending",
      prompt: body.prompt,
      creditsSpent: PHOTO_CREDIT_COST,
      provider: "kie",
      providerJobId,
      metadata: {
        enhancedPrompt,
        style: body.style,
        modelId: body.modelId,
      },
    });

    // Award XP for generation (non-blocking)
    addXp(userId, 5, "photo_generation", generation.id)
      .then(() => checkAndAwardBadges(userId))
      .catch((err) => console.error("[generate/photo] XP/badge error:", err));

    return apiSuccess(generation);
  } catch (error) {
    console.error("[generate/photo] DB error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка сохранения генерации", 500);
  }
}
