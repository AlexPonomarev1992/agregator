import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getLeaderboard } from "@/lib/db/queries";

const MAX_LIMIT = 100;
const MAX_PAGE = 1000;
const DEFAULT_LIMIT = 20;

/**
 * GET /api/rating/leaderboard [public]
 * Топ пользователей с рейтингом. Поддержка ?page=1&limit=20.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Math.min(MAX_PAGE, Number(searchParams.get("page")) || 1));
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT)
    );
    const offset = (page - 1) * limit;

    const leaderboard = await getLeaderboard(limit, offset);

    return apiSuccess(leaderboard, { page, total: leaderboard.length });
  } catch (error) {
    console.error("[GET /api/rating/leaderboard] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки рейтинга", 500);
  }
}
