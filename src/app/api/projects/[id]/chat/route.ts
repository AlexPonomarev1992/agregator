import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { validateBody } from "@/lib/api/validate";
import { sendMessageSchema } from "@/lib/api/validation";
import { forbidden, notFound } from "@/lib/api/response";
import {
  getProjectById,
  getProjectMessages,
  createMessage,
} from "@/lib/db/queries/projects";
import { mockPersonas } from "@/lib/mock/personas";
import { sendChatMessage, createCollectorStream } from "@/lib/api/llm";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** POST /api/projects/[id]/chat — отправить сообщение в чат проекта */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const { id: projectId } = await context.params;

  // Валидация тела запроса
  const body = await validateBody(request, sendMessageSchema);
  if (body instanceof Response) return body;

  try {
    // Проверяем проект и права доступа
    const project = await getProjectById(projectId);
    if (!project) return notFound("Проект");
    if (project.userId !== userId) return forbidden();

    // Сохраняем сообщение пользователя в БД
    await createMessage({
      projectId,
      role: "user",
      content: body.content,
      attachments: body.attachments
        ? body.attachments.map((a) => ({
            id: crypto.randomUUID(),
            name: a.name ?? "file",
            size: 0,
            type: a.type,
            url: a.url,
          }))
        : undefined,
    });

    // Собираем контекст для LLM
    const messages = await buildChatContext(project, projectId);

    // Модель из запроса (приоритет) или из проекта
    const modelId = body.modelId || project.modelId || "openai/gpt-4o";

    // AbortController для остановки стрима при дисконнекте клиента
    const abortController = new AbortController();

    // Запускаем стриминг от LLM
    const llmStream = sendChatMessage(messages, modelId);

    // Оборачиваем в коллектор для сохранения полного ответа в БД
    const outputStream = createCollectorStream(llmStream, async (fullText) => {
      if (fullText.trim()) {
        try {
          await createMessage({
            projectId,
            role: "assistant",
            content: fullText,
          });
        } catch (error) {
          console.error(
            "[POST /api/projects/[id]/chat] Error saving assistant message:",
            error
          );
        }
      }
    });

    // Оборачиваем стрим с обработкой отключения клиента
    const streamWithCancel = new ReadableStream({
      async start(controller) {
        const reader = outputStream.getReader();
        const onAbort = () => {
          reader.cancel();
          controller.close();
        };
        abortController.signal.addEventListener("abort", onAbort);

        try {
          while (true) {
            if (abortController.signal.aborted) break;
            const { done, value } = await reader.read();
            if (done) break;
            try {
              controller.enqueue(value);
            } catch {
              // Stream closed by client
              break;
            }
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error("[POST /api/projects/[id]/chat] Stream error:", error);
          }
        } finally {
          abortController.signal.removeEventListener("abort", onAbort);
          try { controller.close(); } catch { /* already closed */ }
        }
      },
      cancel() {
        abortController.abort();
      },
    });

    // Возвращаем SSE-стрим
    return new Response(streamWithCancel, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[POST /api/projects/[id]/chat] Error:", error);
    return notFound("Проект");
  }
}

/**
 * Собирает массив сообщений для LLM:
 * - системный промпт (контекст проекта + персона)
 * - последние 20 сообщений из истории
 */
async function buildChatContext(
  project: { context: string | null; personaId: string | null },
  projectId: string
): Promise<{ role: "system" | "user" | "assistant"; content: string }[]> {
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [];

  // Build system prompt
  const systemParts: string[] = [];

  // Persona system prompt
  if (project.personaId) {
    const persona = mockPersonas.find((p) => p.id === project.personaId);
    if (persona) {
      systemParts.push(persona.systemPrompt);
    }
  }

  // Project context
  if (project.context) {
    systemParts.push(`Контекст проекта:\n${project.context}`);
  }

  // Default system prompt if nothing else
  if (systemParts.length === 0) {
    systemParts.push(
      "Ты — универсальный ИИ-ассистент VibeLab. Помогай с любыми задачами. Отвечай ясно, структурировано и по делу."
    );
  }

  messages.push({
    role: "system",
    content: systemParts.join("\n\n"),
  });

  // Fetch last 20 messages for context
  const recentMessages = await getProjectMessages(projectId, 20);

  const VALID_CHAT_ROLES = new Set(["user", "assistant"]);

  for (const msg of recentMessages) {
    if (!VALID_CHAT_ROLES.has(msg.role)) continue;
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  return messages;
}
