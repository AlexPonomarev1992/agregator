import { NextRequest, NextResponse } from "next/server"
import { eq, desc, gte } from "drizzle-orm"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { db } from "@/lib/db"
import { xpEvents } from "@/lib/db/schema"

/**
 * GET /api/rating/xp-events
 * Returns XP events for the last 12 weeks (for activity graph)
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const { userId } = auth

  try {
    const twelveWeeksAgo = new Date()
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84)

    const events = await db
      .select({
        amount: xpEvents.amount,
        createdAt: xpEvents.createdAt,
      })
      .from(xpEvents)
      .where(
        eq(xpEvents.userId, userId),
      )
      .orderBy(desc(xpEvents.createdAt))
      .limit(500)

    return apiSuccess(events)
  } catch (error) {
    console.error("[GET /api/rating/xp-events] Error:", error)
    return apiError("INTERNAL_ERROR", "Ошибка загрузки XP событий", 500)
  }
}
