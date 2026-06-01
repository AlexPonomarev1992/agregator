/**
 * Anthropic Messages API (Claude * на KIE через /codex/v1/responses).
 *
 * Особенности:
 *   - system-сообщение выносится в отдельное поле body.system
 *     (Anthropic API не принимает role:"system" внутри messages).
 *   - max_tokens обязательный.
 *
 * SSE-событие: event: content_block_delta
 *              data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"<chunk>"}}
 */

import type { ChatMessage, ChatOptions } from '../types';

export function buildAnthropicBody(
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Record<string, unknown> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const userAssistant = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  return {
    model,
    stream: opts.stream ?? true,
    max_tokens: opts.maxTokens ?? 4096,
    ...(systemMsg ? { system: systemMsg.content } : {}),
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    messages: userAssistant,
  };
}

export function parseAnthropicDelta(block: string): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (!raw || raw === '[DONE]') return null;

  try {
    const parsed = JSON.parse(raw) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (parsed.type === 'content_block_delta') {
      const d = parsed.delta;
      if (
        d &&
        (d.type === 'text_delta' || d.type === undefined) &&
        typeof d.text === 'string'
      ) {
        return d.text;
      }
    }
  } catch {
    // не JSON — игнорируем
  }
  return null;
}
