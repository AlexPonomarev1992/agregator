import { eq, and, desc } from "drizzle-orm"
import { db } from "../index"
import { notifications, type SelectNotification } from "../schema"

/** Получить уведомления пользователя (последние N) */
export async function getUserNotifications(
  userId: string,
  limit: number = 30
): Promise<SelectNotification[]> {
  try {
    return await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: desc(notifications.createdAt),
      limit,
    })
  } catch (error) {
    console.error("[getUserNotifications] Error:", error)
    throw error
  }
}

/** Количество непрочитанных */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const unread = await db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ),
      columns: { id: true },
    })
    return unread.length
  } catch (error) {
    console.error("[getUnreadCount] Error:", error)
    throw error
  }
}

/** Пометить все как прочитанные */
export async function markAllRead(userId: string): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      )
  } catch (error) {
    console.error("[markAllRead] Error:", error)
    throw error
  }
}

/** Пометить одно как прочитанное */
export async function markAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      )
  } catch (error) {
    console.error("[markAsRead] Error:", error)
    throw error
  }
}

/** Создать уведомление */
export async function createNotification(data: {
  userId: string
  type: "badge" | "generation" | "rank" | "credits" | "subscription" | "xp" | "system"
  title: string
  description: string
  iconName: string
  referenceId?: string
}): Promise<SelectNotification> {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        description: data.description,
        iconName: data.iconName,
        referenceId: data.referenceId ?? null,
      })
      .returning()

    return notification
  } catch (error) {
    console.error("[createNotification] Error:", error)
    throw error
  }
}
