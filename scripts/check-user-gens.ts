import { db } from "../src/lib/db"
import { users, generations } from "../src/lib/db/schema"
import { eq, desc } from "drizzle-orm"

async function main() {
  const email = process.argv[2] ?? "laba.insight@gmail.com"
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) { console.log("no user"); return }
  console.log("User:", user.id, user.email)

  const gens = await db.select().from(generations).where(eq(generations.userId, user.id)).orderBy(desc(generations.createdAt)).limit(15)
  console.log("Generations count:", gens.length)
  for (const g of gens) {
    console.log(JSON.stringify({
      id: g.id,
      status: g.status,
      type: g.type,
      provider: g.provider,
      providerJobId: g.providerJobId,
      resultUrl: g.resultUrl,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    }))
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
