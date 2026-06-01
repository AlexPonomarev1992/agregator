import { eq, and, desc } from "drizzle-orm"
import { db } from "../index"
import {
  projects,
  chatMessages,
  type SelectProject,
  type InsertProject,
  type SelectChatMessage,
  type InsertChatMessage,
} from "../schema"

/** Получить проекты пользователя (не архивные) */
export async function getProjectsByUser(
  userId: string
): Promise<SelectProject[]> {
  try {
    return await db.query.projects.findMany({
      where: and(
        eq(projects.userId, userId),
        eq(projects.isArchived, false)
      ),
      orderBy: desc(projects.updatedAt),
    })
  } catch (error) {
    console.error("[getProjectsByUser] Error:", error)
    throw error
  }
}

/** Получить проект по ID */
export async function getProjectById(
  id: string
): Promise<SelectProject | null> {
  try {
    const result = await db.query.projects.findFirst({
      where: eq(projects.id, id),
    })

    return result ?? null
  } catch (error) {
    console.error("[getProjectById] Error:", error)
    throw error
  }
}

/** Создать новый проект */
export async function createProject(
  data: InsertProject
): Promise<SelectProject> {
  try {
    const [project] = await db
      .insert(projects)
      .values(data)
      .returning()

    return project
  } catch (error) {
    console.error("[createProject] Error:", error)
    throw error
  }
}

/** Обновить поля проекта */
export async function updateProject(
  id: string,
  data: Partial<
    Pick<InsertProject, "name" | "description" | "context" | "modelId" | "personaId">
  >
): Promise<SelectProject> {
  try {
    const [updated] = await db
      .update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning()

    if (!updated) {
      throw new Error(`Project not found: ${id}`)
    }

    return updated
  } catch (error) {
    console.error("[updateProject] Error:", error)
    throw error
  }
}

/** Архивировать проект */
export async function archiveProject(id: string): Promise<SelectProject> {
  try {
    const [archived] = await db
      .update(projects)
      .set({ isArchived: true })
      .where(eq(projects.id, id))
      .returning()

    if (!archived) {
      throw new Error(`Project not found: ${id}`)
    }

    return archived
  } catch (error) {
    console.error("[archiveProject] Error:", error)
    throw error
  }
}

/** Получить сообщения проекта, упорядоченные по дате создания */
export async function getProjectMessages(
  projectId: string,
  limit: number = 50
): Promise<SelectChatMessage[]> {
  try {
    return await db.query.chatMessages.findMany({
      where: eq(chatMessages.projectId, projectId),
      orderBy: chatMessages.createdAt,
      limit,
    })
  } catch (error) {
    console.error("[getProjectMessages] Error:", error)
    throw error
  }
}

/** Создать сообщение в чате проекта */
export async function createMessage(
  data: InsertChatMessage
): Promise<SelectChatMessage> {
  try {
    const [message] = await db
      .insert(chatMessages)
      .values(data)
      .returning()

    return message
  } catch (error) {
    console.error("[createMessage] Error:", error)
    throw error
  }
}
