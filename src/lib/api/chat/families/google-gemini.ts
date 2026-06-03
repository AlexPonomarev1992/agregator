/**
 * Google Gemini native (`generateContent` / `streamGenerateContent`) на KIE.
 *
 * Особенности:
 *   - role: только "user" | "model". "assistant" → "model", "system" не
 *     поддерживается внутри `contents` — выносится в `systemInstruction`.
 *   - сообщения структурируются как { role, parts: [{text}] }.
 *   - `generationConfig.maxOutputTokens` вместо `max_tokens`.
 *   - `thinkingConfig.thinkingLevel`: low | high (если задано — включаем).
 *
 * SSE-чанк: data: { "candidates": [{"content": {"parts": [{"text": "<chunk>"}]}}] }
 * Финал: data: { "usageMetadata": {...} } → data: [DONE]
 */

import type { ChatMessage, ChatOptions } from '../types';

export function buildGeminiBody(
  _model: string,
  messages: ChatMessage[],
  opts: ChatOptions
): Record<string, unknown> {
  const systemMsg = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const generationConfig: Record<string, unknown> = {};
  if (opts.maxTokens !== undefined) {
    generationConfig.maxOutputTokens = opts.maxTokens;
  }
  if (opts.temperature !== undefined) {
    generationConfig.temperature = opts.temperature;
  }
  // Map наших reasoningEffort на gemini thinkingLevel.
  if (opts.reasoningEffort) {
    const level =
      opts.reasoningEffort === 'low' ? 'low' : 'high'; // medium/high/xhigh → high
    generationConfig.thinkingConfig = { thinkingLevel: level };
  }

  return {
    stream: opts.stream ?? true,
    contents,
    ...(systemMsg
      ? { systemInstruction: { parts: [{ text: systemMsg.content }] } }
      : {}),
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
  };
}

export function parseGeminiDelta(block: string): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (!raw || raw === '[DONE]') return null;

  try {
    const parsed = JSON.parse(raw) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const parts = parsed.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;
    // Собираем все текстовые куски одного чанка в одну строку.
    const texts = parts
      .map((p) => (typeof p.text === 'string' ? p.text : ''))
      .filter(Boolean);
    return texts.length > 0 ? texts.join('') : null;
  } catch {
    return null;
  }
}
