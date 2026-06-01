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
          "Ты — генератор названий чатов. Генерируй короткое название (максимум 40 символов, без кавычек, без точки в конце) для чата по первому сообщению пользователя. Верни ТОЛЬКО название, без пояснений.",
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

    const title = raw.trim().slice(0, 40) || text.slice(0, 40);
    return apiSuccess({ title });
  } catch (error) {
    console.error("[POST /api/agent/chat-title] Error:", error);
    // Fallback: first 40 chars of text
    const fallback = text.slice(0, 40);
    return apiSuccess({ title: fallback });
  }
}
