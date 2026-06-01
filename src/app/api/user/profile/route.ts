import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError, notFound } from "@/lib/api/response";
import { validateBody } from "@/lib/api/validate";
import { updateProfileSchema } from "@/lib/api/validation";
import { getUserById, updateUserProfile } from "@/lib/db/queries/users";

/** GET /api/user/profile — получить профиль текущего пользователя */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const user = await getUserById(userId);

    if (!user) {
      return notFound("Пользователь");
    }

    return apiSuccess({
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      socialLinks: user.socialLinks,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      credits: user.credits ?? { balance: 0, totalBought: 0, totalSpent: 0 },
      rating: user.rating ?? { totalXp: 0, rank: null, badgesCount: 0 },
      subscription: user.subscription ?? null,
    });
  } catch (error) {
    console.error("[GET /api/user/profile] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки профиля", 500);
  }
}

/** PATCH /api/user/profile — обновить профиль текущего пользователя */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await validateBody(request, updateProfileSchema);
  if (body instanceof NextResponse) return body;

  try {
    const updated = await updateUserProfile(userId, body);

    return apiSuccess({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      bio: updated.bio,
      socialLinks: updated.socialLinks,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("[PATCH /api/user/profile] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка обновления профиля", 500);
  }
}
