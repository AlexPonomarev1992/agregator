import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { unauthorized } from "./response";

// Session data returned by auth guard
interface AuthSession {
  userId: string;
  email?: string;
  name?: string;
}

interface RequireAuthResult {
  userId: string;
  session: AuthSession;
}

/**
 * Получает сессию из запроса через Better Auth.
 *
 * @throws Error если сессия не найдена
 */
export async function getAuthSession(
  request: NextRequest
): Promise<AuthSession> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Проверяет авторизацию в API route.
 * Возвращает { userId, session } или NextResponse с ошибкой 401.
 *
 * Usage:
 * ```ts
 * const auth = await requireAuth(request);
 * if (auth instanceof NextResponse) return auth;
 * const { userId, session } = auth;
 * ```
 */
export async function requireAuth(
  request: NextRequest
): Promise<RequireAuthResult | ReturnType<typeof unauthorized>> {
  try {
    const session = await getAuthSession(request);
    return { userId: session.userId, session };
  } catch {
    return unauthorized();
  }
}
