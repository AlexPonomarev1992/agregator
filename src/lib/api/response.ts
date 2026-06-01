import { NextResponse } from "next/server";

// Метаданные пагинации
interface PaginationMeta {
  page?: number;
  total?: number;
}

// Формат успешного ответа: { data: T, meta?: { page, total } }
export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta
): NextResponse {
  const body: { data: T; meta?: PaginationMeta } = { data };
  if (meta) {
    body.meta = meta;
  }
  return NextResponse.json(body, { status: 200 });
}

// Формат ошибки: { error: { code, message } }
export function apiError(
  code: string,
  message: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { error: { code, message } },
    { status }
  );
}

// --- Common error helpers based on API.md error codes ---

export function unauthorized(): NextResponse {
  return apiError("UNAUTHORIZED", "Не авторизован", 401);
}

export function forbidden(): NextResponse {
  return apiError("FORBIDDEN", "Нет доступа", 403);
}

export function notFound(resource?: string): NextResponse {
  const message = resource ? `${resource} не найден` : "Не найдено";
  return apiError("NOT_FOUND", message, 404);
}

export function insufficientCredits(): NextResponse {
  return apiError(
    "INSUFFICIENT_CREDITS",
    "Недостаточно кредитов для генерации",
    402
  );
}

export function subscriptionRequired(): NextResponse {
  return apiError(
    "SUBSCRIPTION_REQUIRED",
    "Нужна подписка RoyalPass",
    402
  );
}

export function validationError(message: string): NextResponse {
  return apiError("VALIDATION_ERROR", message, 400);
}

export function externalApiError(message: string): NextResponse {
  return apiError("EXTERNAL_API_ERROR", message, 502);
}
