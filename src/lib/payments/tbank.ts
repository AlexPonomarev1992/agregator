import crypto from "crypto"

// --- Price maps (all amounts in kopecks) ---

const CREDIT_PRICES: Record<number, number> = {
  50: 29900,
  150: 79900,
  500: 249900,
}

const PLAN_PRICES: Record<string, number> = {
  monthly: 99900,
  yearly: 799900,
}

const TBANK_API_URL =
  process.env.TBANK_API_URL || "https://rest-api-test.tinkoff.ru/v2"

// --- Signature verification (exactly as in PAYMENTS.md) ---

export function verifyWebhookSignature(
  params: Record<string, string>,
  secretKey: string
): boolean {
  const { Token, ...rest } = params

  // Sort keys alphabetically, take values
  const values = Object.keys(rest)
    .sort()
    .map((key) => rest[key])
    .join("")

  // SHA-256 of concatenated values + SecretKey
  const hash = crypto
    .createHash("sha256")
    .update(values + secretKey)
    .digest("hex")

  return hash === Token?.toLowerCase()
}

// --- Price helpers ---

/**
 * Returns price in kopecks for a given credit amount.
 * Throws if the credit amount is not in the price map.
 */
export function getAmountForCredits(credits: number): number {
  const price = CREDIT_PRICES[credits]
  if (price === undefined) {
    throw new Error(
      `Недопустимое количество кредитов: ${credits}. Допустимые: ${Object.keys(CREDIT_PRICES).join(", ")}`
    )
  }
  return price
}

/**
 * Returns price in kopecks for a subscription plan.
 */
export function getAmountForPlan(plan: "monthly" | "yearly"): number {
  return PLAN_PRICES[plan]
}

// --- T-Bank API Init ---

interface InitPaymentParams {
  terminalKey: string
  amount: number
  orderId: string
  description: string
  notificationUrl: string
}

interface InitPaymentResult {
  paymentUrl: string
  paymentId: string
}

/**
 * Calls T-Bank API Init endpoint to create a payment.
 * Returns payment URL for redirect and paymentId.
 */
export async function initPayment({
  terminalKey,
  amount,
  orderId,
  description,
  notificationUrl,
}: InitPaymentParams): Promise<InitPaymentResult> {
  const response = await fetch(`${TBANK_API_URL}/Init`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      TerminalKey: terminalKey,
      Amount: amount,
      OrderId: orderId,
      Description: description,
      NotificationURL: notificationUrl,
    }),
  })

  if (!response.ok) {
    throw new Error(`T-Bank API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.Success) {
    throw new Error(`T-Bank Init failed: ${data.Message || data.ErrorCode}`)
  }

  return {
    paymentUrl: data.PaymentURL,
    paymentId: String(data.PaymentId),
  }
}
