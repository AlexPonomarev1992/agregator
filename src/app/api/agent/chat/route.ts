import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiError, apiSuccess } from "@/lib/api/response";
import { sendChatMessage, createCollectorStream } from "@/lib/api/llm";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import {
  getProjectMessages,
  createMessage,
} from "@/lib/db/queries/projects";

// Принудительно Node runtime — нужен для стриминга больших ответов LLM
// без таймаута Edge и буферизации, характерной для serverless-edge.
export const runtime = "nodejs";
// Никакого статического кеширования для streaming endpoint.
export const dynamic = "force-dynamic";

const AGENT_PROJECT_NAME = "__agent__";

/** Find or create the hidden agent project for a user */
async function getOrCreateAgentProject(userId: string): Promise<string> {
  const existing = await db.query.projects.findFirst({
    where: and(
      eq(projects.userId, userId),
      eq(projects.name, AGENT_PROJECT_NAME)
    ),
  });

  if (existing) return existing.id;

  const [created] = await db
    .insert(projects)
    .values({
      userId,
      name: AGENT_PROJECT_NAME,
      description: "ИИ Агент — системный проект",
      isArchived: false,
    })
    .returning();

  return created.id;
}

/** GET /api/agent/chat — загрузить историю сообщений агента */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const projectId = await getOrCreateAgentProject(userId);
    const messages = await getProjectMessages(projectId, 50);

    return apiSuccess(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[GET /api/agent/chat] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки истории", 500);
  }
}

/** POST /api/agent/chat — отправить сообщение ИИ-агенту */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  let body: {
    message?: string;
    content?: string;
    modelId?: string;
    model?: string;
    systemPrompt?: string;
    instructions?: string;
    instructionsEnabled?: boolean;
    attachments?: Array<{ id: string; type: string; url: string; name: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON", 400);
  }

  // Accept both 'message' and 'content' fields for backward compat
  const message = (body.message ?? body.content)?.trim();
  if (!message) {
    return apiError("VALIDATION_ERROR", "Message is required", 400);
  }

  // Accept both 'modelId' and 'model' fields
  const modelId = body.modelId ?? body.model ?? "claude-sonnet-4-20250514";

  try {
    const projectId = await getOrCreateAgentProject(userId);

    // Save user message
    await createMessage({
      projectId,
      role: "user",
      content: message,
    });

    // Build context from history
    const history = await getProjectMessages(projectId, 20);
    // Build system prompt: base + optional user instructions
    const baseSystemPrompt =
      body.systemPrompt ??
      "Ты — ИИ-агент VibeLab. Помогай с генерацией контента, отвечай на вопросы о создании изображений, видео, текстов. Отвечай ясно, структурировано и по делу. Отвечай на русском языке.";

    let systemContent = baseSystemPrompt;
    if (body.instructionsEnabled && body.instructions?.trim()) {
      systemContent = `${baseSystemPrompt}\n\n--- Пользовательские инструкции ---\n${body.instructions.trim()}`;
    }

    // Append attachment context if any
    if (body.attachments && body.attachments.length > 0) {
      const attList = body.attachments.map((a) => `- ${a.name} (${a.type}): ${a.url}`).join('\n');
      systemContent += `\n\n--- Прикреплённые файлы ---\n${attList}`;
    }

    const llmMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      {
        role: "system",
        content: systemContent,
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const llmStream = sendChatMessage(llmMessages, modelId);

    // Collect full response and save to DB
    const outputStream = createCollectorStream(llmStream, async (fullText) => {
      if (fullText.trim()) {
        try {
          await createMessage({
            projectId,
            role: "assistant",
            content: fullText,
          });
        } catch (error) {
          console.error("[POST /api/agent/chat] Error saving response:", error);
        }
      }
    });

    return new Response(outputStream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Отключает буферизацию SSE в Nginx/Cloudflare прокси —
        // без этого клиент видит ответ только по концу стрима.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[POST /api/agent/chat] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка генерации ответа", 500);
  }
}
