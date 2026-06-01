import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { validateBody } from "@/lib/api/validate";
import { generateVideoSchema } from "@/lib/api/validation";
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

const VIDEO_CREDIT_COST = 20;

export async function POST(request: NextRequest) {
  // Проверка авторизации
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  // Валидация тела запроса
  const body = await validateBody(request, generateVideoSchema);
  if (body instanceof NextResponse) return body;

  // Списание кредитов (атомарная проверка баланса + списание)
  try {
    await deductCredits(
      userId,
      VIDEO_CREDIT_COST,
      `Генерация видео: ${body.prompt.slice(0, 50)}...`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    if (message.includes("Insufficient credits")) {
      return insufficientCredits();
    }
    console.error("[generate/video] Credit deduction error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка списания кредитов", 500);
  }

  // Enhance prompt before sending to KIE
  let enhancedPrompt: string;
  try {
    enhancedPrompt = await enhancePrompt(body.prompt, "video", body.modelId, !!body.imageUrl);
  } catch {
    enhancedPrompt = body.prompt;
  }

  // Запуск задачи в KIE API
  let providerJobId: string | null = null;
  try {
    const task = await createKieTask(enhancedPrompt, "video", body.modelId, {
      duration: body.duration?.toString(),
      aspectRatio: body.aspectRatio,
      resolution: body.resolution,
      sound: body.sound,
      mode: body.mode,
      templateId: body.templateId,
      imageUrl: body.imageUrl,
      endFrameUrl: body.endFrameUrl,
    });
    providerJobId = task.taskId;
  } catch (error) {
    console.error("[generate/video] KIE API error:", error);
    // Создаём запись со статусом failed, кредиты уже списаны
    const generation = await createGeneration({
      userId,
      type: "video",
      status: "failed",
      prompt: body.prompt,
      creditsSpent: VIDEO_CREDIT_COST,
      provider: "kie",
      providerJobId: null,
      metadata: {
        duration: body.duration,
        aspectRatio: body.aspectRatio,
        modelId: body.modelId,
        templateId: body.templateId,
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
    return externalApiError(
      `Ошибка запуска генерации видео. Generation ID: ${generation.id}`
    );
  }

  // Создание записи генерации в БД
  try {
    const generation = await createGeneration({
      userId,
      type: "video",
      status: "pending",
      prompt: body.prompt,
      creditsSpent: VIDEO_CREDIT_COST,
      provider: "kie",
      providerJobId,
      metadata: {
        enhancedPrompt,
        duration: body.duration,
        aspectRatio: body.aspectRatio,
        modelId: body.modelId,
        templateId: body.templateId,
      },
    });

    // Award XP for generation (non-blocking)
    addXp(userId, 10, "video_generation", generation.id)
      .then(() => checkAndAwardBadges(userId))
      .catch((err) => console.error("[generate/video] XP/badge error:", err));

    return apiSuccess(generation);
  } catch (error) {
    console.error("[generate/video] DB error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка сохранения генерации", 500);
  }
}
