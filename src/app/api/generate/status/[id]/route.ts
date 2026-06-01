import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, notFound, externalApiError } from "@/lib/api/response";
import {
  getGenerationById,
  updateGenerationStatus,
} from "@/lib/db/queries/generations";
import { getKieTaskStatus } from "@/lib/api/kie";
import { notify } from "@/lib/services/notify";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Проверка авторизации
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const { id } = await params;

  // Получить генерацию и проверить владельца
  try {
    const generation = await getGenerationById(id);

    if (!generation) {
      return notFound("Генерация");
    }

    // Проверка что генерация принадлежит пользователю
    if (generation.userId !== userId) {
      return notFound("Генерация");
    }

    // Если генерация в процессе — опросить внешний API для обновления статуса
    if (
      (generation.status === "pending" ||
        generation.status === "processing") &&
      generation.providerJobId
    ) {
      try {
        const externalStatus = await getKieTaskStatus(generation.providerJobId);
        console.log(`[generate/status] KIE status for ${generation.providerJobId}: ${externalStatus.status}, url: ${externalStatus.resultUrl ?? 'none'}`);

        // Обновить статус в БД если он изменился
        if (externalStatus.status !== generation.status) {
          const updated = await updateGenerationStatus(
            id,
            externalStatus.status,
            externalStatus.resultUrl ?? undefined,
            externalStatus.error
              ? {
                  ...((generation.metadata as Record<string, unknown>) ??
                    {}),
                  providerError: externalStatus.error,
                }
              : undefined
          );

          // Notify when generation completes
          if (externalStatus.status === "done") {
            notify.generationDone(userId, generation.type as "video" | "photo", generation.prompt, id);
          }

          return apiSuccess(updated);
        }
      } catch (error) {
        console.error(
          `[generate/status] Provider status check error for ${generation.provider}:`,
          error
        );
        // Не падаем — возвращаем текущий статус из БД
      }
    }

    return apiSuccess(generation);
  } catch (error) {
    console.error("[generate/status] Error:", error);
    return externalApiError("Ошибка получения статуса генерации");
  }
}
