import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getUserRating } from "@/lib/db/queries";

/**
 * GET /api/rating/me
 * Рейтинг текущего пользователя: totalXp, rank, badgesCount.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const rating = await getUserRating(userId);

    if (!rating) {
      // Return default values if no rating record exists
      return apiSuccess({
        userId,
        totalXp: 0,
        rank: null,
        badgesCount: 0,
      });
    }

    return apiSuccess(rating);
  } catch (error) {
    console.error("[GET /api/rating/me] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки рейтинга", 500);
  }
}
