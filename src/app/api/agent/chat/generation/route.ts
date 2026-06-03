import { NextRequest } from "next/server"
import { and, eq } from "drizzle-orm"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { db } from "@/lib/db"
import { projects } from "@/lib/db/schema"
import { createMessage, getProjectById } from "@/lib/db/queries/projects"
import { z } from "zod"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const AGENT_PROJECT_NAME = "__agent__"

const bodySchema = z.object({
  generationId: z.string().uuid(),
  mediaType: z.enum(["video", "image", "audio"]),
  userText: z.string().max(5000).optional(),
  caption: z.string().max(2000).optional(),
  chatId: z.string().uuid().optional(),
})

async function resolveProjectId(userId: string, chatId?: string): Promise<string | null> {
  if (chatId) {
    const project = await getProjectById(chatId)
    if (!project || project.userId !== userId) return null
    return project.id
  }
  // Скрытый проект агента (как в /api/agent/chat)
  const existing = await db.query.projects.findFirst({
    where: and(eq(projects.userId, userId), eq(projects.name, AGENT_PROJECT_NAME)),
  })
  if (existing) return existing.id
  const [created] = await db
    .insert(projects)
    .values({ userId, name: AGENT_PROJECT_NAME, description: "ИИ Агент — системный проект", isArchived: false })
    .returning()
  return created.id
}

/**
 * POST /api/agent/chat/generation
 * Сохраняет в историю чата запрос пользователя + сообщение-генерацию,
 * привязанное к generationId. Медиа подтянется в историю при завершении
 * генерации (статус досматривает серверный реконсилятор) — даже офлайн.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof Response) return auth
  const { userId } = auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return apiError("VALIDATION_ERROR", "Invalid JSON", 400)
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid body", 400)
  }

  const { generationId, mediaType, userText, caption, chatId } = parsed.data

  try {
    const projectId = await resolveProjectId(userId, chatId)
    if (!projectId) return apiError("NOT_FOUND", "Чат не найден", 404)

    if (userText?.trim()) {
      await createMessage({ projectId, role: "user", content: userText.trim() })
    }

    const message = await createMessage({
      projectId,
      role: "assistant",
      content: caption?.trim() ?? "",
      generationId,
      mediaType,
    })

    return apiSuccess({ id: message.id })
  } catch (error) {
    console.error("[POST /api/agent/chat/generation] Error:", error)
    return apiError("INTERNAL_ERROR", "Не удалось сохранить генерацию в чат", 500)
  }
}
