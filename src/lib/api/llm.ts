import { mockPersonas } from "@/lib/mock/personas";
import { chatViaKie } from "@/lib/api/kie-chat";

// Message format for LLM API calls
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface SendChatOptions {
  temperature?: number;
  maxTokens?: number;
}

/**
 * Абстракция над LLM-провайдерами.
 * Возвращает ReadableStream в формате SSE.
 */
export function sendChatMessage(
  messages: ChatMessage[],
  modelId: string,
  options?: SendChatOptions
): ReadableStream<Uint8Array> {
  const provider = getProviderForModel(modelId);

  switch (provider) {
    case "kie":
      return chatViaKie({ model: modelId, messages, stream: true, ...options });
    case "anthropic":
      return streamAnthropic(messages, modelId, options);
    case "openai":
      return streamOpenAI(messages, modelId, options);
    case "google":
      return streamGoogle(messages, modelId, options);
    case "openrouter":
      return streamOpenRouter(messages, modelId, options);
    default:
      return streamMock(messages, modelId);
  }
}

type Provider = "kie" | "anthropic" | "openai" | "google" | "openrouter" | "mock";

// KIE-proxied model IDs come from AGENT_MODELS catalog
const KIE_MODEL_IDS = new Set([
  'claude-sonnet-4-20250514',
  'gpt-4o',
  'gpt-4o-mini',
  'gemini-2.0-flash',
  'grok-3',
  'deepseek-v3',
  'claude-haiku-3-5',
]);

function getProviderForModel(modelId: string): Provider {
  const kieKey = process.env.KLING_API_KEY ?? process.env.KIE_API_KEY;

  // If model is in the KIE catalog and we have a key, use KIE
  if (KIE_MODEL_IDS.has(modelId) && kieKey) {
    return "kie";
  }

  // Direct provider keys take priority for legacy model IDs
  if (
    modelId.startsWith("claude") &&
    process.env.ANTHROPIC_API_KEY
  ) {
    return "anthropic";
  }
  if (
    modelId.startsWith("gpt") &&
    process.env.OPENAI_API_KEY
  ) {
    return "openai";
  }
  if (
    modelId.startsWith("gemini") &&
    process.env.GOOGLE_AI_API_KEY
  ) {
    return "google";
  }
  // Fallback to OpenRouter for any model when key is available
  if (process.env.OPENROUTER_API_KEY) {
    return "openrouter";
  }
  return "mock";
}

// --- SSE helpers ---

function sseEncode(data: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ content: data })}\n\n`);
}

function sseDone(): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode("data: [DONE]\n\n");
}

// --- Anthropic ---

function streamAnthropic(
  messages: ChatMessage[],
  _modelId: string,
  options?: SendChatOptions
): ReadableStream<Uint8Array> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: ANTHROPIC_API_KEY");
  }
  // Separate system message from the rest
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": apiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: options?.maxTokens ?? 4096,
              system: systemMessage?.content ?? "",
              messages: conversationMessages,
              stream: true,
            }),
          }
        );

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("[LLM Anthropic] Error:", errorText);
          controller.enqueue(
            sseEncode("Ошибка при обращении к Anthropic API.")
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (
                parsed.type === "content_block_delta" &&
                parsed.delta?.text
              ) {
                controller.enqueue(sseEncode(parsed.delta.text));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error("[LLM Anthropic] Stream error:", error);
        controller.enqueue(
          sseEncode("Произошла ошибка при генерации ответа.")
        );
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

// --- OpenAI ---

function streamOpenAI(
  messages: ChatMessage[],
  _modelId: string,
  options?: SendChatOptions
): ReadableStream<Uint8Array> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o",
              messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: options?.maxTokens ?? 4096,
              stream: true,
            }),
          }
        );

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("[LLM OpenAI] Error:", errorText);
          controller.enqueue(
            sseEncode("Ошибка при обращении к OpenAI API.")
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(sseEncode(delta));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error("[LLM OpenAI] Stream error:", error);
        controller.enqueue(
          sseEncode("Произошла ошибка при генерации ответа.")
        );
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

// --- Google AI ---

function streamGoogle(
  messages: ChatMessage[],
  _modelId: string,
  options?: SendChatOptions
): ReadableStream<Uint8Array> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: GOOGLE_AI_API_KEY");
  }

  // Convert messages to Google format
  const systemMessage = messages.find((m) => m.role === "system");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?alt=sse&key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents,
              systemInstruction: systemMessage
                ? { parts: [{ text: systemMessage.content }] }
                : undefined,
              generationConfig: {
                maxOutputTokens: options?.maxTokens ?? 4096,
              },
            }),
          }
        );

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("[LLM Google] Error:", errorText);
          controller.enqueue(
            sseEncode("Ошибка при обращении к Google AI API.")
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(sseEncode(text));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error("[LLM Google] Stream error:", error);
        controller.enqueue(
          sseEncode("Произошла ошибка при генерации ответа.")
        );
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

// --- OpenRouter (OpenAI-compatible, supports all models) ---

// Map internal model IDs to OpenRouter model identifiers
function getOpenRouterModelId(modelId: string): string {
  // If already a full OpenRouter ID (contains "/"), pass through
  if (modelId.includes("/")) return modelId;
  // Legacy short IDs fallback
  if (modelId.startsWith("claude")) return "anthropic/claude-sonnet-4.6";
  if (modelId.startsWith("gpt")) return "openai/gpt-5.4";
  if (modelId.startsWith("gemini")) return "google/gemini-2.5-flash";
  return modelId;
}

function streamOpenRouter(
  messages: ChatMessage[],
  modelId: string,
  options?: SendChatOptions
): ReadableStream<Uint8Array> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENROUTER_API_KEY");
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
              "HTTP-Referer": process.env.BETTER_AUTH_URL || "https://vibelab.polimatai.site",
              "X-Title": "VibeLab",
            },
            body: JSON.stringify({
              model: getOpenRouterModelId(modelId),
              messages: messages.map((m) => ({
                role: m.role,
                content: m.content,
              })),
              max_tokens: options?.maxTokens ?? 4096,
              temperature: options?.temperature,
              stream: true,
            }),
          }
        );

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          console.error("[LLM OpenRouter] Error:", errorText);
          controller.enqueue(
            sseEncode("Ошибка при обращении к OpenRouter API.")
          );
          controller.enqueue(sseDone());
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                controller.enqueue(sseEncode(delta));
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
      } catch (error) {
        console.error("[LLM OpenRouter] Stream error:", error);
        controller.enqueue(
          sseEncode("Произошла ошибка при генерации ответа.")
        );
        controller.enqueue(sseDone());
        controller.close();
      }
    },
  });
}

// --- Mock streaming response ---

function streamMock(
  messages: ChatMessage[],
  modelId: string
): ReadableStream<Uint8Array> {
  // Determine persona from system prompt to give contextual response
  const systemMsg = messages.find((m) => m.role === "system");
  const userMsg = [...messages].reverse().find((m) => m.role === "user");

  const persona = mockPersonas.find((p) =>
    systemMsg?.content?.includes(p.systemPrompt.slice(0, 30))
  );

  const personaName = persona?.name ?? "Универсальный ассистент";
  const userContent = userMsg?.content ?? "привет";

  const mockResponse = generateMockResponse(personaName, userContent, modelId);

  return new ReadableStream({
    async start(controller) {
      // Stream character by character with small delays for realistic feel
      for (let i = 0; i < mockResponse.length; i++) {
        controller.enqueue(sseEncode(mockResponse[i]));
        // Small delay between characters (simulate typing)
        await new Promise((resolve) => setTimeout(resolve, 15));
      }
      controller.enqueue(sseDone());
      controller.close();
    },
  });
}

function generateMockResponse(
  personaName: string,
  userMessage: string,
  modelId: string
): string {
  const responses: Record<string, string> = {
    "Код-ревьюер": `Отличный вопрос! Давай разберём это с точки зрения архитектуры и лучших практик.

По поводу "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}":

1. **Структура** — рекомендую разделить логику на отдельные модули
2. **Типизация** — используй строгие TypeScript типы вместо any
3. **Тестирование** — покрой критичные пути unit-тестами

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`,

    "Дизайнер": `Интересная задача! Вот мои мысли по дизайну.

По запросу "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}":

- **Визуальная иерархия** — выдели главное через размер и контраст
- **Цветовая палитра** — используй не более 3 основных цветов
- **Типографика** — Geist Sans для интерфейса, Inter для текста

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`,

    "Продакт-менеджер": `Давай подойдём к этому системно!

Анализ "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}":

- **Impact** — оцени влияние на ключевые метрики (retention, revenue)
- **Effort** — определи сложность реализации (dev-часы, зависимости)
- **Приоритизация** — используй RICE framework для ранжирования

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`,

    "Контент-райтер": `Давай создадим цепляющий контент!

По теме "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}":

- **Хук** — начни с провокационного вопроса или факта
- **Структура** — короткие абзацы, списки, подзаголовки
- **CTA** — закончи чётким призывом к действию

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`,

    "Ментор": `Отличный вопрос, давай разберёмся вместе!

"${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}" — это важная тема.

Представь это как конструктор: каждый блок выполняет свою функцию, и вместе они создают целое. Начни с простого примера, а потом постепенно усложняй.

Какой аспект хочешь разобрать подробнее?

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`,
  };

  return (
    responses[personaName] ??
    `Привет! Я ИИ-ассистент VibeLab.

По поводу "${userMessage.slice(0, 50)}${userMessage.length > 50 ? "..." : ""}":

Это отличный вопрос! Я готов помочь тебе с этим. Давай разберём задачу по шагам и найдём лучшее решение.

Это демо-ответ (модель: ${modelId}). Подключи API ключ для реальных ответов.`
  );
}

/**
 * Собирает полный текст ответа из SSE-потока.
 * Используется для сохранения ответа ассистента в БД.
 */
export function createCollectorStream(
  source: ReadableStream<Uint8Array>,
  onComplete: (fullText: string) => void
): ReadableStream<Uint8Array> {
  let fullText = "";
  const decoder = new TextDecoder();

  return new ReadableStream({
    async start(controller) {
      const reader = source.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Pass through to client
          controller.enqueue(value);

          // Collect text for DB storage
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
              }
            } catch {
              // Skip
            }
          }
        }
      } finally {
        controller.close();
        onComplete(fullText);
      }
    },
  });
}
