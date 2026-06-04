import { eq, sql } from "drizzle-orm"
import { db } from "../index"
import {
  userCredits,
  creditTransactions,
  type SelectUserCredits,
  type SelectCreditTransaction,
} from "../schema"
import { DEV_UNLIMITED_CREDITS } from "@/lib/studio/credits"

/** Получить текущий баланс кредитов пользователя */
export async function getCredits(
  userId: string
): Promise<SelectUserCredits | null> {
  try {
    const result = await db.query.userCredits.findFirst({
      where: eq(userCredits.userId, userId),
    })

    return result ?? null
  } catch (error) {
    console.error("[getCredits] Error:", error)
    throw error
  }
}

/** Атомарное списание кредитов: проверка баланса + списание + запись транзакции */
export async function deductCredits(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<SelectCreditTransaction> {
  if (amount <= 0) {
    throw new Error("Deduct amount must be positive")
  }

  try {
    return await db.transaction(async (tx) => {
      // Row lock to prevent race conditions under concurrent requests
      const [locked] = await tx
        .select()
        .from(userCredits)
        .where(sql`${userCredits.userId} = ${userId}`)
        .for("update")

      if (!locked || locked.balance < amount) {
        // Безлимит в локальной разработке: не списываем, фиксируем нулевую
        // транзакцию для совместимости с возвращаемым типом.
        if (DEV_UNLIMITED_CREDITS) {
          const [devTx] = await tx
            .insert(creditTransactions)
            .values({
              userId,
              amount: 0,
              type: "generation",
              description: `${reason} (dev unlimited)`,
              referenceId: referenceId ?? null,
            })
            .returning()
          return devTx
        }
        throw new Error("Insufficient credits")
      }

      // Atomic deduct after lock acquired
      const [updated] = await tx
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} - ${amount}`,
          totalSpent: sql`${userCredits.totalSpent} + ${amount}`,
        })
        .where(
          sql`${userCredits.userId} = ${userId}`
        )
        .returning()

      if (!updated) {
        throw new Error("Insufficient credits")
      }

      // Record the transaction
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          userId,
          amount: -amount,
          type: "generation",
          description: reason,
          referenceId: referenceId ?? null,
        })
        .returning()

      return transaction
    })
  } catch (error) {
    console.error("[deductCredits] Error:", error)
    throw error
  }
}

/** Начислить кредиты пользователю + создать запись транзакции */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "bonus",
  description: string,
  referenceId?: string
): Promise<SelectCreditTransaction> {
  if (amount <= 0) {
    throw new Error("Add amount must be positive")
  }

  try {
    return await db.transaction(async (tx) => {
      // Update balance
      await tx
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} + ${amount}`,
          totalBought:
            type === "purchase"
              ? sql`${userCredits.totalBought} + ${amount}`
              : undefined,
        })
        .where(eq(userCredits.userId, userId))

      // Record the transaction
      const [transaction] = await tx
        .insert(creditTransactions)
        .values({
          userId,
          amount,
          type,
          description,
          referenceId: referenceId ?? null,
        })
        .returning()

      return transaction
    })
  } catch (error) {
    console.error("[addCredits] Error:", error)
    throw error
  }
}
