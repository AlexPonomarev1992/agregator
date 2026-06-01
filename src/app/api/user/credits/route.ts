import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getCredits } from "@/lib/db/queries/credits";

/** GET /api/user/credits — получить текущий баланс кредитов */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const credits = await getCredits(userId);

    return apiSuccess({
      balance: credits?.balance ?? 0,
      totalBought: credits?.totalBought ?? 0,
      totalSpent: credits?.totalSpent ?? 0,
    });
  } catch (error) {
    console.error("[GET /api/user/credits] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки кредитов", 500);
  }
}
