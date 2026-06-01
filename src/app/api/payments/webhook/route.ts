import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { paymentLogs } from "@/lib/db/schema/payment-logs"
import { userCredits } from "@/lib/db/schema/user-credits"
import { creditTransactions } from "@/lib/db/schema/credit-transactions"
import { subscriptions } from "@/lib/db/schema/subscriptions"
import { badges } from "@/lib/db/schema/badges"
import { userBadges } from "@/lib/db/schema/user-badges"
import { tbankWebhookSchema } from "@/lib/api/validation"
import { verifyWebhookSignature } from "@/lib/payments/tbank"
import { notify } from "@/lib/services/notify"

/**
 * T-Bank webhook handler.
 * Public endpoint (no auth), but verifies webhook signature.
 * Must return "OK" text response for T-Bank to acknowledge.
 */
export async function POST(request: NextRequest) {
  let rawBody: Record<string, unknown>

  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 })
  }

  // Validate webhook payload
  const parsed = tbankWebhookSchema.safeParse(rawBody)
  if (!parsed.success) {
    console.error("[payments/webhook] Invalid payload:", parsed.error.errors)
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 })
  }

  const payload = parsed.data

  // Verify signature — секретный ключ обязателен, без него вебхук не обрабатываем
  const secretKey = process.env.TBANK_SECRET_KEY
  if (!secretKey) {
    console.error("[payments/webhook] TBANK_SECRET_KEY is not configured — refusing to process webhook without signature verification")
    return NextResponse.json({ error: "SERVER_MISCONFIGURED" }, { status: 500 })
  }

  // Convert all values to strings for signature verification
  const stringParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(rawBody)) {
    stringParams[key] = String(value)
  }

  if (!verifyWebhookSignature(stringParams, secretKey)) {
    console.error("[payments/webhook] Invalid signature for order:", payload.OrderId)
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 403 })
  }

  // Find payment_log by orderId
  const paymentLog = await db.query.paymentLogs.findFirst({
    where: eq(paymentLogs.orderId, payload.OrderId),
  })

  if (!paymentLog) {
    console.error("[payments/webhook] Payment not found:", payload.OrderId)
    return new Response("OK", { status: 200 })
  }

  // Already processed — idempotency guard
  if (paymentLog.status !== "pending") {
    return new Response("OK", { status: 200 })
  }

  const status = payload.Status

  try {
    if (status === "CONFIRMED") {
      await handleConfirmed(paymentLog)
    } else if (status === "CANCELLED" || status === "REJECTED") {
      await db
        .update(paymentLogs)
        .set({ status: "cancelled" })
        .where(eq(paymentLogs.id, paymentLog.id))
    }
    // For other statuses (AUTHORIZED, etc.) — do nothing, wait for final status
  } catch (error) {
    console.error("[payments/webhook] Processing error:", error)
    return NextResponse.json({ error: "PROCESSING_ERROR" }, { status: 500 })
  }

  return new Response("OK", { status: 200 })
}

/**
 * Handles CONFIRMED payment — adds credits or activates subscription.
 * Uses db.transaction() for atomicity.
 */
async function handleConfirmed(
  paymentLog: typeof paymentLogs.$inferSelect
) {
  const metadata = paymentLog.metadata as Record<string, unknown> | null

  if (paymentLog.paymentType === "credits") {
    const creditsAmount = (metadata?.credits as number) || 0

    await db.transaction(async (tx) => {
      // Update payment status
      await tx
        .update(paymentLogs)
        .set({ status: "confirmed" })
        .where(eq(paymentLogs.id, paymentLog.id))

      // Add credits to user (upsert)
      const existing = await tx.query.userCredits.findFirst({
        where: eq(userCredits.userId, paymentLog.userId),
      })

      if (existing) {
        await tx
          .update(userCredits)
          .set({
            balance: existing.balance + creditsAmount,
            totalBought: existing.totalBought + creditsAmount,
          })
          .where(eq(userCredits.userId, paymentLog.userId))
      } else {
        await tx.insert(userCredits).values({
          userId: paymentLog.userId,
          balance: creditsAmount,
          totalBought: creditsAmount,
        })
      }

      // Create credit_transaction record
      await tx.insert(creditTransactions).values({
        userId: paymentLog.userId,
        amount: creditsAmount,
        type: "purchase",
        description: `Покупка ${creditsAmount} кредитов`,
        referenceId: paymentLog.id,
      })
    })

    notify.creditsAdded(paymentLog.userId, creditsAmount)
  } else if (paymentLog.paymentType === "subscription") {
    const plan = (metadata?.plan as "monthly" | "yearly") || "monthly"

    const now = new Date()
    const expiresAt = new Date(now)
    if (plan === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1)
    } else {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    }

    await db.transaction(async (tx) => {
      // Update payment status
      await tx
        .update(paymentLogs)
        .set({ status: "confirmed" })
        .where(eq(paymentLogs.id, paymentLog.id))

      // Create or update subscription
      const existingSub = await tx.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, paymentLog.userId),
          eq(subscriptions.status, "active")
        ),
      })

      if (existingSub) {
        // Extend existing subscription
        const newExpiry = new Date(
          Math.max(existingSub.expiresAt.getTime(), now.getTime())
        )
        if (plan === "monthly") {
          newExpiry.setMonth(newExpiry.getMonth() + 1)
        } else {
          newExpiry.setFullYear(newExpiry.getFullYear() + 1)
        }

        await tx
          .update(subscriptions)
          .set({
            plan,
            expiresAt: newExpiry,
            tbankOrderId: paymentLog.orderId,
          })
          .where(eq(subscriptions.id, existingSub.id))
      } else {
        await tx.insert(subscriptions).values({
          userId: paymentLog.userId,
          status: "active",
          plan,
          startedAt: now,
          expiresAt,
          tbankOrderId: paymentLog.orderId,
        })
      }

      // Award "Королевская особа" badge
      await awardRoyalBadge(tx, paymentLog.userId)
    })

    notify.subscriptionActivated(paymentLog.userId, plan)
  }
}

/**
 * Awards the "Королевская особа" badge if the user doesn't have it yet.
 */
async function awardRoyalBadge(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string
) {
  try {
    // Find the badge
    const royalBadge = await tx.query.badges.findFirst({
      where: eq(badges.name, "Королевская особа"),
    })

    if (!royalBadge) return

    // Check if user already has it
    const existing = await tx.query.userBadges.findFirst({
      where: and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, royalBadge.id)
      ),
    })

    if (!existing) {
      await tx.insert(userBadges).values({
        userId,
        badgeId: royalBadge.id,
      })
    }
  } catch (error) {
    // Badge award is non-critical, log but don't fail the transaction
    console.error("[payments/webhook] Failed to award badge:", error)
  }
}
