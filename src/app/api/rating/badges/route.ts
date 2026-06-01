import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getUserBadges } from "@/lib/db/queries";

/**
 * GET /api/rating/badges
 * Бейджи текущего пользователя с деталями бейджа.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const userBadgesList = await getUserBadges(userId);

    return apiSuccess(userBadgesList);
  } catch (error) {
    console.error("[GET /api/rating/badges] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки бейджей", 500);
  }
}
