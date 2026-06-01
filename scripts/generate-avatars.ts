import { eq, isNull } from "drizzle-orm"
import { db } from "../src/lib/db"
import { users } from "../src/lib/db/schema"

async function main() {
  console.log("Generating avatars for users without one...")

  const usersWithoutAvatar = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(isNull(users.avatarUrl))

  console.log(`Found ${usersWithoutAvatar.length} users without avatar`)

  for (const user of usersWithoutAvatar) {
    const style = "adventurer"
    const avatarUrl = `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(user.id)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`

    await db
      .update(users)
      .set({ avatarUrl })
      .where(eq(users.id, user.id))

    console.log(`  ${user.name ?? user.id} → avatar generated`)
  }

  console.log("Done!")
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
