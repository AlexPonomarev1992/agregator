import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { validationError } from "./response";

/**
 * Парсит и валидирует тело запроса через Zod-схему.
 * Возвращает распарсенные данные или NextResponse с ошибкой валидации.
 *
 * Usage:
 * ```ts
 * const result = await validateBody(request, generateVideoSchema);
 * if (result instanceof NextResponse) return result;
 * // result is typed as GenerateVideoInput
 * ```
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T | NextResponse> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return validationError("Невалидный JSON в теле запроса");
  }

  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      return validationError(messages);
    }
    return validationError("Ошибка валидации");
  }
}
