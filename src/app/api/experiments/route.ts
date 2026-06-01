import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getAuthSession } from "@/lib/api/auth-guard";
import {
  getPublishedExperiments,
  getUserExperiments,
} from "@/lib/db/queries";

/**
 * GET /api/experiments [public]
 * Список опубликованных экспериментов.
 * Если пользователь авторизован — включает прогресс из user_experiments.
 */
export async function GET(request: NextRequest) {
  try {
    const experimentsList = await getPublishedExperiments();

    // Try to get user session (optional — public endpoint)
    let userProgress: Record<string, { status: string; xpEarned: number }> = {};

    try {
      const session = await getAuthSession(request);
      const userExps = await getUserExperiments(session.userId);
      for (const ue of userExps) {
        userProgress[ue.experimentId] = {
          status: ue.status,
          xpEarned: ue.xpEarned,
        };
      }
    } catch {
      // Not authenticated — return experiments without progress
    }

    const data = experimentsList.map((exp) => ({
      ...exp,
      userProgress: userProgress[exp.id] ?? null,
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error("[GET /api/experiments] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки экспериментов", 500);
  }
}
