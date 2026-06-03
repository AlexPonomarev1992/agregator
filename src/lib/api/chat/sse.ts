/**
 * Кодирование исходящего SSE-потока к нашему клиенту.
 * Формат — единый для всех моделей: data: {"content": "<chunk>"}\n\n
 * Этот же формат парсит ChatView в браузере.
 */

const ENCODER = new TextEncoder();

export function sseEncode(content: string): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify({ content })}\n\n`);
}

/**
 * Дельта «размышлений» reasoning-моделей. Отдельное поле, чтобы клиент мог
 * показать индикатор «думает…», а коллектор не сохранял это в текст ответа.
 */
export function sseReasoning(reasoning: string): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify({ reasoning })}\n\n`);
}

export function sseDone(): Uint8Array {
  return ENCODER.encode('data: [DONE]\n\n');
}
