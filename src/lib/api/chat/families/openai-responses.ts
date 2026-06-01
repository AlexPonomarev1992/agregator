/**
 * OpenAI Responses API (GPT-5.x на KIE через /codex/v1/responses).
 *
 * Документация формата:
 *   body.input = [{role, content: [{type: "input_text", text: "..."}]}]
 *   SSE-событие: event: response.output_text.delta
 *                data: {"type":"response.output_text.delta","delta":"<chunk>"}
 */

import type { ChatMessage, ChatOptions } from '../types';

export function buildOpenAIResponsesBody(
  model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Record<string, unknown> {
  return {
    model,
    stream: opts.stream ?? true,
    input: messages.map((m) => ({
      role: m.role,
      content: [{ type: 'input_text', text: m.content }],
    })),
    reasoning: { effort: opts.reasoningEffort ?? 'low' },
  };
}

export function parseOpenAIResponsesDelta(block: string): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (!raw || raw === '[DONE]') return null;

  try {
    const parsed = JSON.parse(raw) as { type?: string; delta?: unknown };
    if (
      parsed.type === 'response.output_text.delta' &&
      typeof parsed.delta === 'string'
    ) {
      return parsed.delta;
    }
  } catch {
    // не JSON — игнорируем
  }
  return null;
}
