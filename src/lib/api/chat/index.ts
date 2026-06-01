/**
 * Публичный entry-point для chat через KIE.
 *
 * Тонкий слой: берёт ModelConfig из реестра, делает fetch, режет SSE на
 * блоки и проксирует дельты в наш формат. Всё, что специфично для модели
 * (формат тела, парсинг SSE), живёт в конфиге модели и family-хелперах.
 */

import type { ChatMessage, ChatOptions, ModelConfig } from './types';
import { resolveModel, MODELS, DEFAULT_MODEL } from './models';
import { sseEncode, sseDone } from './sse';

const KIE_API_KEY = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

export type { ChatMessage, ChatOptions, ModelConfig };
export { MODELS, DEFAULT_MODEL, resolveModel };

interface ChatViaKieParams extends ChatOptions {
  model: string;
  messages: ChatMessage[];
}

export function chatViaKie(params: ChatViaKieParams): ReadableStream<Uint8Array> {
  if (!KIE_API_KEY) return mockStream(params.messages);

  const model = resolveModel(params.model);
  const opts: ChatOptions = {
    stream: params.stream ?? true,
    maxTokens: params.maxTokens,
    temperature: params.temperature,
    reasoningEffort: params.reasoningEffort,
  };

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${KIE_BASE_URL}${model.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${KIE_API_KEY}`,
          },
          body: JSON.stringify(model.buildBody(params.messages, opts)),
        });

        if (!response.ok || !response.body) {
          const errText = await response.text();
          console.error(
            `[KIE Chat] ${model.id} HTTP ${response.status}:`,
            errText.slice(0, 500)
          );
          controller.enqueue(
            sseEncode(
              `Ошибка KIE (${response.status}): ${errText.slice(0, 200)}`
            )
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        await pumpStream(response.body, model, controller);
        controller.enqueue(sseDone());
        controller.close();
      } catch (err) {
        console.error('[KIE Chat] Stream error:', err);
        controller.enqueue(sseEncode('Произошла ошибка при генерации ответа.'));
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

/**
 * Читает SSE-поток от KIE, режет на блоки (events разделены "\n\n"),
 * выдёргивает дельту через config.parseDelta и отдаёт клиенту в нашем формате.
 *
 * Если за весь поток не было ни одной дельты — пытается распарсить хвостовой
 * буфер как JSON-ошибку (KIE иногда отдаёт HTTP 200 + {code:500, msg:...}).
 */
async function pumpStream(
  body: ReadableStream<Uint8Array>,
  model: ModelConfig,
  controller: ReadableStreamDefaultController<Uint8Array>
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emittedAny = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const block of events) {
      const delta = model.parseDelta(block);
      if (delta) {
        emittedAny = true;
        controller.enqueue(sseEncode(delta));
      }
    }
  }

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
}

function mockStream(messages: ChatMessage[]): ReadableStream<Uint8Array> {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = `[KIE Mock] Ответ на: "${(lastUser?.content ?? '').slice(0, 60)}..."\n\nПодключи KIE_API_KEY для реальных ответов.`;

  return new ReadableStream({
    async start(controller) {
      for (const ch of text) {
        controller.enqueue(sseEncode(ch));
        await new Promise((r) => setTimeout(r, 12));
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}
