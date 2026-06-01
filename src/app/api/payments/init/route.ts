import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api/auth-guard"
import { validateBody } from "@/lib/api/validate"
import { initPaymentSchema } from "@/lib/api/validation"
import { apiSuccess, apiError } from "@/lib/api/response"
import { db } from "@/lib/db"
import { paymentLogs } from "@/lib/db/schema/payment-logs"
import {
  getAmountForCredits,
  getAmountForPlan,
  initPayment,
} from "@/lib/payments/tbank"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  // Check auth
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth

  const { userId } = auth

  // Validate body
  const body = await validateBody(request, initPaymentSchema)
  if (body instanceof NextResponse) return body

  // Calculate amount based on type
  let amount: number
  let description: string
  let metadata: Record<string, unknown>

  try {
    if (body.type === "credits") {
      amount = getAmountForCredits(body.credits!)
      description = `Покупка ${body.credits} кредитов VibeLab`
      metadata = { type: "credits", credits: body.credits }
    } else {
      amount = getAmountForPlan(body.plan!)
      const planLabel = body.plan === "monthly" ? "месяц" : "год"
      description = `RoyalPass подписка на ${planLabel}`
      metadata = { type: "subscription", plan: body.plan }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка расчёта суммы"
    return apiError("VALIDATION_ERROR", message, 400)
  }

  // Generate unique orderId
  const orderId = `vl_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`

  // Create payment_log record with status 'pending'
  try {
    await db.insert(paymentLogs).values({
      userId,
      orderId,
      amount,
      status: "pending",
      paymentType: body.type,
      metadata,
    })
  } catch (error) {
    console.error("[payments/init] Failed to create payment log:", error)
    return apiError("EXTERNAL_API_ERROR", "Ошибка создания платежа", 500)
  }

  // Call T-Bank API Init (or return mock URL for testing)
  const terminalKey = process.env.TBANK_TERMINAL_KEY

  if (!terminalKey) {
    // Mock mode for testing without T-Bank credentials
    console.warn("[payments/init] TBANK_TERMINAL_KEY не задан — используется mock-режим оплаты. НЕ использовать в продакшене!")
    const mockPaymentUrl = `https://securepay.tinkoff.ru/mock?orderId=${orderId}&amount=${amount}`
    return apiSuccess({ orderId, paymentUrl: mockPaymentUrl, amount })
  }

  try {
    const notificationUrl =
      process.env.TBANK_NOTIFICATION_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`

    const { paymentUrl } = await initPayment({
      terminalKey,
      amount,
      orderId,
      description,
      notificationUrl,
    })

    return apiSuccess({ orderId, paymentUrl, amount })
  } catch (error) {
    console.error("[payments/init] T-Bank API error:", error)
    return apiError(
      "EXTERNAL_API_ERROR",
      "Ошибка инициализации платежа в Т-Банке",
      502
    )
  }
}
