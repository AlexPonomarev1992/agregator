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

  const body = JSON.stringify(model.buildBody(params.messages, opts));
  const url = `${KIE_BASE_URL}${model.endpoint}`;

  return new ReadableStream({
    async start(controller) {
      const MAX_ATTEMPTS = 3;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${KIE_API_KEY}`,
            },
            body,
          });

          // HTTP-уровень: 5xx/429 → ретраим, остальное (4xx) — отдаём как есть.
          if (!response.ok || !response.body) {
            const errText = await response.text();
            console.error(
              `[KIE Chat] ${model.id} HTTP ${response.status} (try ${attempt}):`,
              errText.slice(0, 500)
            );
            if (
              isTransientStatus(response.status) &&
              attempt < MAX_ATTEMPTS
            ) {
              await backoff(attempt);
              continue;
            }
            controller.enqueue(
              sseEncode(`Ошибка KIE (${response.status}): ${errText.slice(0, 200)}`)
            );
            break;
          }

          const result = await pumpStream(response.body, model, controller);

          // Стрим закончился, но дельт не пришло — KIE отдал JSON-ошибку с HTTP 200.
          // Если ошибка транзиентная — пробуем ещё раз. Если нет — показываем msg.
          if (!result.emittedAny) {
            if (
              result.transient &&
              attempt < MAX_ATTEMPTS
            ) {
              console.warn(
                `[KIE Chat] ${model.id} transient error (try ${attempt}): ${result.errorMsg ?? '?'}`
              );
              await backoff(attempt);
              continue;
            }
            if (result.errorMsg) {
              controller.enqueue(
                sseEncode(
                  result.transient
                    ? 'Сервис KIE временно недоступен. Попробуйте ещё раз через несколько секунд.'
                    : `Ошибка KIE: ${result.errorMsg}`
                )
              );
            }
          }
          break;
        } catch (err) {
          console.error(`[KIE Chat] Network error (try ${attempt}):`, err);
          if (attempt < MAX_ATTEMPTS) {
            await backoff(attempt);
            continue;
          }
          controller.enqueue(sseEncode('Произошла ошибка при генерации ответа.'));
        }
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}

function isTransientStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

const TRANSIENT_PATTERNS = [
  /server exception/i,
  /try again/i,
  /timeout/i,
  /rate limit/i,
  /temporarily unavailable/i,
  /service unavailable/i,
  /upstream/i,
];

function isTransientMessage(msg: string): boolean {
  return TRANSIENT_PATTERNS.some((rx) => rx.test(msg));
}

function backoff(attempt: number): Promise<void> {
  // 400ms, 1200ms (экспоненциально с джиттером)
  const base = 400 * Math.pow(3, attempt - 1);
  const jitter = base * 0.2 * Math.random();
  return new Promise((r) => setTimeout(r, base + jitter));
}

interface PumpResult {
  emittedAny: boolean;
  /** Если стрим закончился без дельт и в теле обнаружена ошибка — её сообщение. */
  errorMsg?: string;
  /** Транзиентная ошибка → имеет смысл ретраить. */
  transient: boolean;
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
): Promise<PumpResult> {
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

  if (emittedAny) return { emittedAny: true, transient: false };

  // Стрим без единой дельты — пробуем достать ошибку из последнего буфера.
  const tail = buffer.trim();
  if (!tail) return { emittedAny: false, transient: false };

  // Tail может содержать одну или несколько "data: {...}" строк.
  let errorMsg: string | undefined;
  const candidates = tail
    .split('\n')
    .map((l) => (l.startsWith('data: ') ? l.slice(6).trim() : l.trim()))
    .filter((s) => s && s !== '[DONE]');

  for (const raw of candidates) {
    try {
      const j = JSON.parse(raw) as {
        code?: number;
        msg?: string;
        error?: { message?: string };
      };
      const msg = j.msg ?? j.error?.message;
      if (msg) {
        errorMsg = msg;
        break;
      }
    } catch {
      // продолжаем
    }
  }

  return {
    emittedAny: false,
    errorMsg,
    transient: errorMsg ? isTransientMessage(errorMsg) : false,
  };
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
