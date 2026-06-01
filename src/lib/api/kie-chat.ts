/**
 * KIE.ai LLM chat — проксирует GPT-5.5 через OpenAI Responses API.
 *
 * Endpoint: POST /codex/v1/responses
 * Модель: "gpt-5-5"
 * Формат тела: { model, input: [{role, content: [{type:"input_text", text}]}], stream, reasoning }
 * Формат SSE-ответа: события `response.output_text.delta` с полем `delta`.
 *
 * Старый /api/v1/chat/completions на KIE не поддерживает chat-модели
 * (возвращает {code:500, msg:"Operation not found: ..."} с HTTP 200) —
 * именно поэтому раньше до клиента долетал только маркер [DONE] без текста.
 */

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';
const KIE_RESPONSES_PATH = '/codex/v1/responses';
const KIE_CHAT_MODEL = 'gpt-5-5';

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

// SSE-формат для клиента (как в llm.ts)
function sseEncode(data: string): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify({ content: data })}\n\n`);
}

function sseDone(): Uint8Array {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

/**
 * Преобразует обычные {role, content: string} в формат Responses API:
 *   {role, content: [{type: "input_text", text: "..."}]}
 */
function toResponsesInput(
  messages: KieChatMessage[]
): Array<{ role: string; content: Array<{ type: 'input_text'; text: string }> }> {
  return messages.map((m) => ({
    role: m.role,
    content: [{ type: 'input_text', text: m.content }],
  }));
}

export function chatViaKie(params: KieChatParams): ReadableStream<Uint8Array> {
  if (!KIE_API_KEY) {
    return mockKieStream(params.messages);
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${KIE_BASE_URL}${KIE_RESPONSES_PATH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
          body: JSON.stringify({
            model: KIE_CHAT_MODEL,
            stream: params.stream ?? true,
            input: toResponsesInput(params.messages),
            reasoning: { effort: params.reasoningEffort ?? 'low' },
          }),
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
          // SSE-события разделяются пустой строкой ("\n\n").
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const eventBlock of events) {
            const delta = parseSseEvent(eventBlock);
            if (delta) {
              emittedAny = true;
              controller.enqueue(sseEncode(delta));
            }
          }
        }

        // Edge-case: KIE мог вернуть HTTP 200 + JSON-ошибку в теле
        // (например, {code:500, msg:"Operation not found"}).
        // Если за весь поток ни одного delta не вышло — пробуем распарсить
        // буфер как JSON и пробрасываем сообщение об ошибке пользователю.
        if (!emittedAny) {
          const tail = buffer.trim();
          try {
            const j = JSON.parse(tail) as { code?: number; msg?: string };
            if (j && (j.code !== 200 || j.msg)) {
              controller.enqueue(
                sseEncode(`Ошибка KIE: ${j.msg ?? `code ${j.code ?? '?'}`}`)
              );
            }
          } catch {
            // Не JSON и не SSE — молча идём к [DONE]
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

/**
 * Извлекает текстовую дельту из одного SSE-события Responses API.
 * Структура события:
 *   event: response.output_text.delta
 *   data: {"type":"response.output_text.delta","delta":"hello"}
 *
 * Игнорирует все остальные типы событий (response.created, reasoning, completed и т.п.).
 */
function parseSseEvent(block: string): string | null {
  const dataLine = block
    .split('\n')
    .find((l) => l.startsWith('data: '));
  if (!dataLine) return null;

  const raw = dataLine.slice(6).trim();
  if (raw === '[DONE]' || !raw) return null;

  try {
    const parsed = JSON.parse(raw) as { type?: string; delta?: unknown };
    if (
      parsed.type === 'response.output_text.delta' &&
      typeof parsed.delta === 'string'
    ) {
      return parsed.delta;
    }
  } catch {
    // не JSON — пропускаем
  }
  return null;
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
