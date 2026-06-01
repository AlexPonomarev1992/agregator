import { db } from "../src/lib/db"
import { users } from "../src/lib/db/schema"
import { inArray } from "drizzle-orm"

const TEST_EMAILS = [
  "test@vibelab.ru",
  "test2@vibelab.ru",
  "demo@vibelab.ru",
  "sdjfkjs@ncdsjnj.com",
]

async function main() {
  console.log("Cleaning up test users...")

  const testUsers = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.email, TEST_EMAILS))

  console.log(`Found ${testUsers.length} test users:`)
  testUsers.forEach((u) => console.log(`  - ${u.name} (${u.email})`))

  if (testUsers.length === 0) {
    console.log("Nothing to delete.")
    process.exit(0)
  }

  // CASCADE will clean up user_credits, user_ratings, etc.
  const deleted = await db
    .delete(users)
    .where(inArray(users.email, TEST_EMAILS))
    .returning({ id: users.id })

  console.log(`Deleted ${deleted.length} test users (CASCADE cleaned related data)`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
