import { db } from "../src/lib/db"
import { users, userCredits, creditTransactions } from "../src/lib/db/schema"
import { eq, sql } from "drizzle-orm"

async function main() {
  const email = process.argv[2]
  const amount = Number(process.argv[3])

  if (!email || !Number.isFinite(amount) || amount === 0) {
    console.error("Usage: tsx scripts/add-credits.ts <email> <amount>")
    process.exit(1)
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name })
    .from(users)
    .where(eq(users.email, email))

  if (!user) {
    console.error(`User not found: ${email}`)
    process.exit(1)
  }

  const [existing] = await db
    .select()
    .from(userCredits)
    .where(eq(userCredits.userId, user.id))

  let newBalance: number
  if (existing) {
    const [updated] = await db
      .update(userCredits)
      .set({
        balance: sql`${userCredits.balance} + ${amount}`,
        totalBought: sql`${userCredits.totalBought} + ${amount}`,
      })
      .where(eq(userCredits.userId, user.id))
      .returning({ balance: userCredits.balance })
    newBalance = updated.balance
  } else {
    const [inserted] = await db
      .insert(userCredits)
      .values({
        userId: user.id,
        balance: amount,
        totalBought: amount,
      })
      .returning({ balance: userCredits.balance })
    newBalance = inserted.balance
  }

  await db.insert(creditTransactions).values({
    userId: user.id,
    amount,
    type: "bonus",
    description: "Manual top-up via admin script",
  })

  console.log(`User: ${user.name ?? "(no name)"} | ${user.email}`)
  console.log(`Added: ${amount} credits`)
  console.log(`New balance: ${newBalance}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
