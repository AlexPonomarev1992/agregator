import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import {
  getUserNotifications,
  getUnreadCount,
  markAllRead,
} from "@/lib/db/queries/notifications"

/**
 * GET /api/notifications
 * Returns user notifications + unread count
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  try {
    const [items, unread] = await Promise.all([
      getUserNotifications(userId, 30),
      getUnreadCount(userId),
    ])

    return apiSuccess({ items, unreadCount: unread })
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка загрузки уведомлений", 500)
  }
}

/**
 * PATCH /api/notifications
 * Mark all notifications as read
 */
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  try {
    await markAllRead(userId)
    return apiSuccess({ ok: true })
  } catch (error) {
    console.error("[PATCH /api/notifications] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка обновления уведомлений", 500)
  }
}
