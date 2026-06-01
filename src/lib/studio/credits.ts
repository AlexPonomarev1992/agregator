import { sql } from "drizzle-orm"
import type { PgTransaction } from "drizzle-orm/pg-core"
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js"
import type { ExtractTablesWithRelations } from "drizzle-orm"
import { db } from "@/lib/db"
import { userCredits, creditTransactions } from "@/lib/db/schema"
import * as schema from "@/lib/db/schema"

type Tx = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>

/**
 * Атомарное списание кредитов внутри существующей транзакции (FOR UPDATE).
 * Кидает Error("Insufficient credits") если баланс недостаточен.
 */
export async function chargeCredits(
  tx: Tx,
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  if (amount <= 0) throw new Error("Charge amount must be positive")

  const [locked] = await tx
    .select()
    .from(userCredits)
    .where(sql`${userCredits.userId} = ${userId}`)
    .for("update")

  if (!locked || locked.balance < amount) {
    throw new Error("Insufficient credits")
  }

  await tx
    .update(userCredits)
    .set({
      balance: sql`${userCredits.balance} - ${amount}`,
      totalSpent: sql`${userCredits.totalSpent} + ${amount}`,
    })
    .where(sql`${userCredits.userId} = ${userId}`)

  await tx.insert(creditTransactions).values({
    userId,
    amount: -amount,
    type: "generation",
    description: reason,
  })
}

/**
 * Возврат кредитов вне транзакции — используется при ошибке dispatch.
 * Не кидает, только логирует.
 */
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  if (amount <= 0) return

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(userCredits)
        .set({
          balance: sql`${userCredits.balance} + ${amount}`,
          totalSpent: sql`${userCredits.totalSpent} - ${amount}`,
        })
        .where(sql`${userCredits.userId} = ${userId}`)

      await tx.insert(creditTransactions).values({
        userId,
        amount,
        type: "bonus",
        description: reason,
      })
    })
  } catch (error) {
    console.error("[refundCredits] Failed to refund credits:", error)
  }
}
