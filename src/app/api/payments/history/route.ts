import { NextRequest, NextResponse } from "next/server"
import { eq, desc, count } from "drizzle-orm"
import { requireAuth } from "@/lib/api/auth-guard"
import { apiSuccess, apiError } from "@/lib/api/response"
import { db } from "@/lib/db"
import { paymentLogs } from "@/lib/db/schema/payment-logs"

export async function GET(request: NextRequest) {
  // Check auth
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { userId } = auth

  // Parse pagination params
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))
  const offset = (page - 1) * limit

  try {
    // Get total count
    const [totalResult] = await db
      .select({ value: count() })
      .from(paymentLogs)
      .where(eq(paymentLogs.userId, userId))

    const total = totalResult?.value ?? 0

    // Get paginated records
    const records = await db
      .select({
        id: paymentLogs.id,
        orderId: paymentLogs.orderId,
        amount: paymentLogs.amount,
        status: paymentLogs.status,
        paymentType: paymentLogs.paymentType,
        metadata: paymentLogs.metadata,
        createdAt: paymentLogs.createdAt,
      })
      .from(paymentLogs)
      .where(eq(paymentLogs.userId, userId))
      .orderBy(desc(paymentLogs.createdAt))
      .limit(limit)
      .offset(offset)

    return apiSuccess(records, { page, total })
  } catch (error) {
    console.error("[payments/history] Query error:", error)
    return apiError("EXTERNAL_API_ERROR", "Ошибка получения истории платежей", 500)
  }
}
