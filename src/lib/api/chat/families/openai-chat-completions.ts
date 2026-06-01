/**
 * OpenAI-совместимый chat/completions формат.
 * Используется KIE для Gemini-моделей через /gemini/v1/chat/completions.
 *
 * Тело запроса:   { model, messages: [{role, content}], stream, max_tokens, temperature }
 * Формат стрима:  data: {"choices":[{"delta":{"content":"<chunk>"}}], ...}
 *                 финальный data: [DONE]
 */

import type { ChatMessage, ChatOptions } from '../types';

export function buildOpenAICompatBody(
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Record<string, unknown> {
  return {
    model,
    stream: opts.stream ?? true,
    max_tokens: opts.maxTokens ?? 4096,
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };
}

export function parseOpenAICompatDelta(block: string): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (!raw || raw === '[DONE]') return null;

  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const delta = parsed.choices?.[0]?.delta?.content;
    if (typeof delta === 'string' && delta.length > 0) return delta;
  } catch {
    // не JSON
  }
  return null;
}
