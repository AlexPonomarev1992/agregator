/**
 * OpenAI-совместимый Chat Completions API (`POST /chat/completions`).
 *
 * Используется провайдерами, которые отдают классический OpenAI-формат:
 *   body.messages = [{role, content}]
 *   SSE-дельта: data: {"choices":[{"delta":{"content":"<chunk>"}}]}
 *
 * Подтверждено живым стримом Gonka (Kimi K2.6, Qwen) с боевым ключом.
 * ВАЖНО: некоторые модели (Kimi) шлют отдельное поле `delta.reasoning`
 * для размышлений — его игнорируем, берём только `delta.content`.
 */

import type { ChatMessage, ChatOptions } from '../types';

export function buildOpenAIChatBody(
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Record<string, unknown> {
  return {
    model,
    stream: opts.stream ?? true,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    ...(opts.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    ...(opts.temperature != null ? { temperature: opts.temperature } : {}),
  };
}

/** Достаёт значение указанного поля из delta SSE-блока (content | reasoning). */
function parseDeltaField(block: string, field: 'content' | 'reasoning'): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (!raw || raw === '[DONE]') return null;

  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{ delta?: Record<string, unknown> }>;
    };
    const value = parsed.choices?.[0]?.delta?.[field];
    if (typeof value === 'string' && value) return value;
  } catch {
    // не JSON — игнорируем
  }
  return null;
}

export function parseOpenAIChatDelta(block: string): string | null {
  return parseDeltaField(block, 'content');
}

/** Дельта размышлений (delta.reasoning) — для индикатора «думает…». */
export function parseOpenAIChatReasoning(block: string): string | null {
  return parseDeltaField(block, 'reasoning');
}
