import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getGenerationsByUser, updateGenerationStatus } from "@/lib/db/queries/generations";
import { getKieTaskStatus } from "@/lib/api/kie";

export async function GET(request: NextRequest) {
  // Проверка авторизации
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  // Пагинация из query params
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );

  const type = searchParams.get("type") as "video" | "photo" | null;
  const validType = type === "video" || type === "photo" ? type : undefined;

  try {
    const { data, total } = await getGenerationsByUser(userId, page, limit, validType);

    // Обновить статусы pending/processing генераций через KIE
    const updatedData = await Promise.all(
      data.map(async (gen) => {
        if ((gen.status === "pending" || gen.status === "processing") && gen.providerJobId) {
          try {
            const kieStatus = await getKieTaskStatus(gen.providerJobId);
            if (kieStatus.status !== gen.status) {
              const updated = await updateGenerationStatus(
                gen.id,
                kieStatus.status,
                kieStatus.resultUrl ?? undefined,
                kieStatus.error
                  ? { ...(gen.metadata as Record<string, unknown> ?? {}), providerError: kieStatus.error }
                  : undefined
              );
              return updated;
            }
          } catch {
            // Не блокируем историю если KIE недоступен
          }
        }
        return gen;
      })
    );

    return apiSuccess(updatedData, { page, total });
  } catch (error) {
    console.error("[generate/history] Error:", error);
    return apiError(
      "INTERNAL_ERROR",
      "Ошибка получения истории генераций",
      500
    );
  }
}
