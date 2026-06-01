import { eq } from "drizzle-orm"
import { db } from "../index"
import {
  users,
  userCredits,
  userRatings,
  subscriptions,
  type SelectUser,
} from "../schema"

// User with related credits, rating, and active subscription
interface UserWithDetails extends SelectUser {
  credits: { balance: number; totalBought: number; totalSpent: number } | null
  rating: { totalXp: number; rank: number | null; badgesCount: number } | null
  subscription: {
    id: string
    status: string
    plan: string
    expiresAt: Date
  } | null
}

/** Получить пользователя по ID с кредитами, рейтингом и подпиской */
export async function getUserById(
  userId: string
): Promise<UserWithDetails | null> {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        credits: true,
        rating: true,
        subscriptions: {
          where: eq(subscriptions.status, "active"),
          limit: 1,
        },
      },
    })

    if (!result) return null

    const { credits, rating, subscriptions: subs, ...user } = result

    return {
      ...user,
      credits: credits
        ? {
            balance: credits.balance,
            totalBought: credits.totalBought,
            totalSpent: credits.totalSpent,
          }
        : null,
      rating: rating
        ? {
            totalXp: rating.totalXp,
            rank: rating.rank,
            badgesCount: rating.badgesCount,
          }
        : null,
      subscription: subs[0]
        ? {
            id: subs[0].id,
            status: subs[0].status,
            plan: subs[0].plan,
            expiresAt: subs[0].expiresAt,
          }
        : null,
    }
  } catch (error) {
    console.error("[getUserById] Error:", error)
    throw error
  }
}

/** Найти пользователя по email (для авторизации) */
export async function getUserByEmail(
  email: string
): Promise<SelectUser | null> {
  try {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    })

    return result ?? null
  } catch (error) {
    console.error("[getUserByEmail] Error:", error)
    throw error
  }
}

/** Обновить профиль пользователя */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    bio?: string
    avatarUrl?: string
    socialLinks?: { platform: string; url: string }[]
  }
): Promise<SelectUser> {
  try {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, userId))
      .returning()

    if (!updated) {
      throw new Error(`User not found: ${userId}`)
    }

    return updated
  } catch (error) {
    console.error("[updateUserProfile] Error:", error)
    throw error
  }
}
