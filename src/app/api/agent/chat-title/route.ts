import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendChatMessage } from "@/lib/api/llm";

/**
 * POST /api/agent/chat-title
 * Generates a short chat title from the first user message.
 * Body: { text: string }
 * Returns: { data: { title: string } }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON", 400);
  }

  const text = (body.text ?? "").trim().slice(0, 100);
  if (!text) {
    return apiError("VALIDATION_ERROR", "text is required", 400);
  }

  try {
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content:
          "Ты — генератор названий чатов для платформы VibeLab. Сформулируй короткое название (максимум 40 символов, без кавычек, без точки в конце) по ТЕМЕ первого сообщения пользователя. " +
          "Никогда не упоминай названия ИИ, моделей или брендов (Claude, GPT, ChatGPT, Kimi, Gemini, Llama, DeepSeek и т.п.) — даже если пользователь спрашивает про возможности ассистента (в этом случае назови чат, например, «Возможности ассистента»). " +
          "Пиши на языке пользователя. Верни ТОЛЬКО название, без пояснений.",
      },
      {
        role: "user",
        content: `Первое сообщение пользователя: ${text}`,
      },
    ];

    // Use fast Haiku model to keep latency low
    const MODEL_ID = "claude-haiku-3-5";
    const stream = sendChatMessage(messages, MODEL_ID);

    // Collect full response
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let raw = "";
    let buffered = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffered += decoder.decode(value, { stream: true });
      const lines = buffered.split("\n");
      buffered = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data) as { content?: string; text?: string };
          raw += parsed.content ?? parsed.text ?? "";
        } catch {
          raw += data;
        }
      }
    }

    const title = sanitizeTitle(raw) || sanitizeTitle(text) || "Новый чат";
    return apiSuccess({ title });
  } catch (error) {
    console.error("[POST /api/agent/chat-title] Error:", error);
    // Fallback: тема из текста пользователя
    return apiSuccess({ title: sanitizeTitle(text) || "Новый чат" });
  }
}

/**
 * Чистит сгенерированное название: снимает кавычки, вырезает утёкшие названия
 * ИИ/моделей/брендов (модель-генератор иногда называет себя), убирает мусорные
 * хвосты и обрезает до 40 символов.
 */
function sanitizeTitle(raw: string): string {
  let t = raw.trim().replace(/^["'«»\s]+|["'«».\s]+$/g, "").trim();
  // Утёкшие бренды/модели ИИ (заменяем на пробел, чтобы не склеить слова)
  t = t.replace(
    /\b(claude|chatgpt|gpt[\w.-]*|kimi|gemini|llama|deepseek|copilot|grok|qwen|openai|anthropic)\b/gi,
    " "
  );
  t = t.replace(/\s{2,}/g, " ").trim();
  // Висящие предлоги/пунктуация после вырезки (напр. «Возможности от» → «Возможности»)
  t = t.replace(/[\s,:;–—-]+$/g, "").trim();
  t = t.replace(/\s+(от|для|на|с|в|и|по|о|об)$/i, "").trim();
  t = t.replace(/[\s,:;–—-]+$/g, "").trim();
  return t.slice(0, 40);
}
