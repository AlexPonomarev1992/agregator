/**
 * Справочник кодов ошибок генерации.
 * Используется и на сервере (для записи в БД), и на клиенте (для отображения).
 */

export const GENERATION_ERROR_CODES = {
  // --- Dispatch ---
  DISPATCH_FAILED:       "DISPATCH_FAILED",
  API_KEY_MISSING:       "API_KEY_MISSING",
  PROVIDER_REJECTED:     "PROVIDER_REJECTED",      // провайдер вернул non-200
  INVALID_REQUEST:       "INVALID_REQUEST",          // провайдер вернул 400
  RATE_LIMITED:          "RATE_LIMITED",             // 429 от провайдера
  PROVIDER_UNAVAILABLE:  "PROVIDER_UNAVAILABLE",     // 5xx от провайдера

  // --- Poll ---
  POLL_FAILED:           "POLL_FAILED",
  POLL_TIMEOUT:          "POLL_TIMEOUT",             // MAX_POLLS exceeded
  STATUS_PARSE_ERROR:    "STATUS_PARSE_ERROR",       // не смогли разобрать resultJson

  // --- Provider terminal ---
  PROVIDER_FAILED:       "PROVIDER_FAILED",          // KIE вернул state=fail
  CONTENT_POLICY:        "CONTENT_POLICY",           // нарушение content policy
  PROMPT_TOO_LONG:       "PROMPT_TOO_LONG",

  // --- Credits ---
  INSUFFICIENT_CREDITS:  "INSUFFICIENT_CREDITS",
  REFUND_FAILED:         "REFUND_FAILED",

  // --- Internal ---
  INTERNAL_ERROR:        "INTERNAL_ERROR",
} as const

export type GenerationErrorCode = typeof GENERATION_ERROR_CODES[keyof typeof GENERATION_ERROR_CODES]

/** Человекочитаемые сообщения для клиента (RU) */
export const GENERATION_ERROR_MESSAGES: Record<GenerationErrorCode, string> = {
  DISPATCH_FAILED:      "Не удалось отправить задачу провайдеру. Кредиты возвращены.",
  API_KEY_MISSING:      "Провайдер временно недоступен — ключ API не настроен.",
  PROVIDER_REJECTED:    "Провайдер отклонил запрос. Кредиты возвращены.",
  INVALID_REQUEST:      "Неверные параметры запроса. Попробуйте изменить промпт.",
  RATE_LIMITED:         "Превышен лимит запросов к провайдеру. Попробуйте через минуту.",
  PROVIDER_UNAVAILABLE: "Провайдер временно недоступен. Попробуйте позже.",
  POLL_FAILED:          "Ошибка при проверке статуса генерации.",
  POLL_TIMEOUT:         "Генерация превысила допустимое время ожидания. Кредиты возвращены.",
  STATUS_PARSE_ERROR:   "Не удалось получить результат от провайдера.",
  PROVIDER_FAILED:      "Провайдер не смог создать контент. Кредиты возвращены.",
  CONTENT_POLICY:       "Запрос нарушает политику контента. Попробуйте другой промпт.",
  PROMPT_TOO_LONG:      "Промпт слишком длинный. Сократите описание.",
  INSUFFICIENT_CREDITS: "Недостаточно кредитов для генерации.",
  REFUND_FAILED:        "Ошибка при возврате кредитов. Обратитесь в поддержку.",
  INTERNAL_ERROR:       "Внутренняя ошибка сервера. Попробуйте позже.",
}

/** Получить человекочитаемое сообщение по коду */
export function getErrorMessage(code: string): string {
  return GENERATION_ERROR_MESSAGES[code as GenerationErrorCode]
    ?? `Ошибка генерации (${code})`
}

/** Определить retryable по коду */
export function isRetryable(code: string): boolean {
  return [
    GENERATION_ERROR_CODES.RATE_LIMITED,
    GENERATION_ERROR_CODES.PROVIDER_UNAVAILABLE,
    GENERATION_ERROR_CODES.POLL_FAILED,
  ].includes(code as GenerationErrorCode)
}
