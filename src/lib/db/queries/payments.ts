import { eq, desc, sql } from "drizzle-orm"
import { db } from "../index"
import {
  paymentLogs,
  type SelectPaymentLog,
  type InsertPaymentLog,
} from "../schema"

/** Создать запись лога платежа */
export async function createPaymentLog(
  data: InsertPaymentLog
): Promise<SelectPaymentLog> {
  try {
    const [log] = await db
      .insert(paymentLogs)
      .values(data)
      .returning()

    return log
  } catch (error) {
    console.error("[createPaymentLog] Error:", error)
    throw error
  }
}

/** Обновить статус платежа по orderId */
export async function updatePaymentStatus(
  orderId: string,
  status: "pending" | "confirmed" | "cancelled"
): Promise<SelectPaymentLog> {
  try {
    const [updated] = await db
      .update(paymentLogs)
      .set({ status })
      .where(eq(paymentLogs.orderId, orderId))
      .returning()

    if (!updated) {
      throw new Error(`Payment not found for orderId: ${orderId}`)
    }

    return updated
  } catch (error) {
    console.error("[updatePaymentStatus] Error:", error)
    throw error
  }
}

/** Получить историю платежей пользователя с пагинацией */
export async function getPaymentHistory(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{ data: SelectPaymentLog[]; total: number }> {
  try {
    const offset = (page - 1) * limit

    const [data, countResult] = await Promise.all([
      db.query.paymentLogs.findMany({
        where: eq(paymentLogs.userId, userId),
        orderBy: desc(paymentLogs.createdAt),
        limit,
        offset,
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(paymentLogs)
        .where(eq(paymentLogs.userId, userId)),
    ])

    return {
      data,
      total: countResult[0].count,
    }
  } catch (error) {
    console.error("[getPaymentHistory] Error:", error)
    throw error
  }
}

/** Получить платёж по orderId */
export async function getPaymentByOrderId(
  orderId: string
): Promise<SelectPaymentLog | null> {
  try {
    const result = await db.query.paymentLogs.findFirst({
      where: eq(paymentLogs.orderId, orderId),
    })

    return result ?? null
  } catch (error) {
    console.error("[getPaymentByOrderId] Error:", error)
    throw error
  }
}
