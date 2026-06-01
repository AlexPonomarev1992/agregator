/**
 * KIE.ai LLM chat — проксирует GPT-5.5 и Claude 4.5/4.7 через
 * единый POST /codex/v1/responses, но с РАЗНЫМИ нативными форматами:
 *
 *   • GPT (gpt-5-5)         → OpenAI Responses API:
 *                             body: { model, input: [{role, content: [{type, text}]}], stream, reasoning }
 *                             SSE: event response.output_text.delta → data.delta
 *
 *   • Claude (claude-*)     → Anthropic native Messages API:
 *                             body: { model, messages, max_tokens, stream }
 *                             SSE: event content_block_delta → data.delta.text
 *
 * Старый /api/v1/chat/completions для этих моделей возвращал HTTP 200
 * с {code:500, msg:"Operation not found"} — именно поэтому раньше до
 * клиента долетал только маркер [DONE] без текста.
 */

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';
const KIE_RESPONSES_PATH = '/codex/v1/responses';

// Дефолтная модель если в UI выбрано что-то незнакомое
const DEFAULT_KIE_MODEL = 'gpt-5-5';

// Известные на KIE chat-модели (подтверждены живыми запросами).
// Любая другая строка автоматически нормализуется к DEFAULT_KIE_MODEL.
const KNOWN_KIE_MODELS = new Set<string>([
  'gpt-5-5',
  'claude-sonnet-4-5',
  'claude-opus-4-5',
  'claude-haiku-4-5',
  'claude-opus-4-7',
]);

interface KieChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KieChatParams {
  model: string;
  messages: KieChatMessage[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: 'low' | 'medium' | 'high' | 'xhigh';
}

// SSE-формат для клиента (один и тот же на выходе для всех моделей)
function sseEncode(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ content: data })}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

type Family = 'gpt' | 'claude';

function familyOf(model: string): Family {
  if (model.startsWith('claude')) return 'claude';
  return 'gpt';
}

function resolveModel(requested: string): string {
  if (KNOWN_KIE_MODELS.has(requested)) return requested;
  // Эвристики для маппинга «человеческих» id на KIE-id
  if (requested.includes('haiku')) return 'claude-haiku-4-5';
  if (requested.includes('opus')) return 'claude-opus-4-7';
  if (requested.startsWith('claude')) return 'claude-sonnet-4-5';
  return DEFAULT_KIE_MODEL;
}

function buildBody(
  family: Family,
  model: string,
  params: KieChatParams
): Record<string, unknown> {
  if (family === 'claude') {
    // Anthropic Messages API: system отдельно от messages.
    const systemMsg = params.messages.find((m) => m.role === 'system');
    const messages = params.messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role, content: m.content }));
    return {
      model,
      stream: params.stream ?? true,
      max_tokens: params.maxTokens ?? 4096,
      ...(systemMsg ? { system: systemMsg.content } : {}),
      ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
      messages,
    };
  }
  // GPT 5.5 Responses API
  return {
    model,
    stream: params.stream ?? true,
    input: params.messages.map((m) => ({
      role: m.role,
      content: [{ type: 'input_text', text: m.content }],
    })),
    reasoning: { effort: params.reasoningEffort ?? 'low' },
  };
}

/**
 * Извлекает дельту текста из одного SSE-блока в зависимости от формата провайдера.
 *
 *   GPT:    {"type":"response.output_text.delta","delta":"hello"}
 *   Claude: {"type":"content_block_delta","delta":{"type":"text_delta","text":"hello"}}
 */
function parseDelta(block: string, family: Family): string | null {
  const dataLine = block.split('\n').find((l) => l.startsWith('data: '));
  if (!dataLine) return null;
  const raw = dataLine.slice(6).trim();
  if (raw === '[DONE]' || !raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      type?: string;
      delta?: unknown;
    };

    if (family === 'gpt') {
      if (
        parsed.type === 'response.output_text.delta' &&
        typeof parsed.delta === 'string'
      ) {
        return parsed.delta;
      }
      return null;
    }

    // claude
    if (parsed.type === 'content_block_delta') {
      const d = parsed.delta as { type?: string; text?: string } | undefined;
      if (d && (d.type === 'text_delta' || !d.type) && typeof d.text === 'string') {
        return d.text;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Chat via kie.ai using their unified /codex/v1/responses endpoint.
 * Возвращает SSE ReadableStream, либо mock-стрим если нет API key.
 */
export function chatViaKie(params: KieChatParams): ReadableStream<Uint8Array> {
  if (!KIE_API_KEY) {
    return mockKieStream(params.messages);
  }

  const model = resolveModel(params.model);
  const family = familyOf(model);

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${KIE_BASE_URL}${KIE_RESPONSES_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
          body: JSON.stringify(buildBody(family, model, params)),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error('[KIE Chat] HTTP error:', response.status, errorText);
          controller.enqueue(
            sseEncode(`Ошибка KIE (${response.status}): ${errorText.slice(0, 200)}`)
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let emittedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          // SSE-события разделяются "\n\n".
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const eventBlock of events) {
            const delta = parseDelta(eventBlock, family);
            if (delta) {
              emittedAny = true;
              controller.enqueue(sseEncode(delta));
            }
          }
        }

        // Если за весь поток ни одного куска текста не было — почти всегда
        // это означает, что KIE вернул HTTP 200 + JSON-ошибку в теле.
        // Пробуем распарсить буфер и пробросить msg пользователю.
        if (!emittedAny) {
          const tail = buffer.trim();
          try {
            const j = JSON.parse(tail) as {
              code?: number;
              msg?: string;
              error?: { message?: string };
            };
            const msg = j.msg ?? j.error?.message;
            if (msg) {
              controller.enqueue(sseEncode(`Ошибка KIE: ${msg}`));
            }
          } catch {
            // не JSON — молча идём к [DONE]
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error('[KIE Chat] Stream error:', error);
        controller.enqueue(sseEncode('Произошла ошибка при генерации ответа.'));
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

function mockKieStream(messages: KieChatMessage[]): ReadableStream<Uint8Array> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const mockText = `[KIE Mock] Ответ на: "${(lastUser?.content ?? '').slice(0, 60)}..."\n\nПодключи KIE_API_KEY для реальных ответов.`;

  return new ReadableStream({
    async start(controller) {
      for (const char of mockText) {
        controller.enqueue(sseEncode(char));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}
