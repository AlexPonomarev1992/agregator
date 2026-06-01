import { db } from "../src/lib/db"
import { users } from "../src/lib/db/schema"
import { desc } from "drizzle-orm"

async function main() {
  const all = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(desc(users.createdAt))

  console.log(`Total users: ${all.length}`)
  console.log("---")
  all.forEach((u) =>
    console.log(`${u.name} | ${u.email} | ${u.createdAt.toISOString().split("T")[0]}`)
  )
  process.exit(0)
}

main().catch(console.error)
