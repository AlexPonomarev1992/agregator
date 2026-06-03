import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { eq } from "drizzle-orm"
import { db, pool } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { userCredits, userRatings } from "@/lib/db/schema"

/** Generate a fun cartoon avatar URL using DiceBear Adventurer style */
function generateAvatarUrl(seed: string): string {
  const style = "adventurer"
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "https://vibelab.polimatai.site",
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://localhost:3005"]
      : []),
  ],
  database: drizzleAdapter(db, {
    provider: "pg",
    // Map Better Auth model names (singular) to our Drizzle schema tables (plural)
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  user: {
    additionalFields: {
      bio: {
        type: "string",
        required: false,
      },
      socialLinks: {
        type: "string",
        required: false,
      },
      isCreator: {
        type: "boolean",
        required: false,
        defaultValue: false,
      },
      avatarUrl: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Generate cartoon avatar for new user
            const avatarUrl = generateAvatarUrl(user.id)
            await db
              .update(schema.users)
              .set({ avatarUrl })
              .where(eq(schema.users.id, user.id))

            // Создаём запись кредитов для нового пользователя
            await db.insert(userCredits).values({
              userId: user.id,
              balance: 0,
              totalBought: 0,
              totalSpent: 0,
            })

            // Создаём запись рейтинга для нового пользователя
            await db.insert(userRatings).values({
              userId: user.id,
              totalXp: 0,
              badgesCount: 0,
            })

            // Создаём игровой профиль
            await pool.query(
              "INSERT INTO game_profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING",
              [user.id]
            )
          } catch (error) {
            console.error("Failed to create user_credits/user_ratings/game_profiles after signup:", error)
          }
        },
      },
    },
  },
})
