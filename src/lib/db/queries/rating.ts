import { eq, desc, and, sql, ne } from "drizzle-orm"
import { db } from "../index"
import {
  userRatings,
  users,
  xpEvents,
  badges,
  userBadges,
  type SelectUserRating,
  type SelectXpEvent,
  type SelectBadge,
  type SelectUserBadge,
} from "../schema"

// Leaderboard entry with user info
interface LeaderboardEntry extends SelectUserRating {
  user: {
    id: string
    name: string | null
    avatarUrl: string | null
  }
}

/** Получить таблицу лидеров, упорядоченную по totalXp */
export async function getLeaderboard(
  limit: number = 50,
  offset: number = 0
): Promise<LeaderboardEntry[]> {
  try {
    const results = await db.query.userRatings.findMany({
      orderBy: desc(userRatings.totalXp),
      limit,
      offset,
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    return results as LeaderboardEntry[]
  } catch (error) {
    console.error("[getLeaderboard] Error:", error)
    throw error
  }
}

/** Получить рейтинг пользователя */
export async function getUserRating(
  userId: string
): Promise<SelectUserRating | null> {
  try {
    const result = await db.query.userRatings.findFirst({
      where: eq(userRatings.userId, userId),
    })

    return result ?? null
  } catch (error) {
    console.error("[getUserRating] Error:", error)
    throw error
  }
}

/** Начислить XP: создать xp_event + обновить totalXp + пересчитать ранги */
export async function addXp(
  userId: string,
  amount: number,
  reason: string,
  referenceId?: string
): Promise<SelectXpEvent> {
  if (amount <= 0) {
    throw new Error("XP amount must be positive")
  }

  try {
    const event = await db.transaction(async (tx) => {
      // Create XP event
      const [xpEvent] = await tx
        .insert(xpEvents)
        .values({
          userId,
          amount,
          reason,
          referenceId: referenceId ?? null,
        })
        .returning()

      // Update total XP in user_ratings
      await tx
        .update(userRatings)
        .set({
          totalXp: sql`${userRatings.totalXp} + ${amount}`,
        })
        .where(eq(userRatings.userId, userId))

      return xpEvent
    })

    // Recalculate ranks and notify if rank improved
    try {
      const oldRating = await db.query.userRatings.findFirst({
        where: eq(userRatings.userId, userId),
      })
      const oldRank = oldRating?.rank ?? null

      await recalculateRanks()

      const newRating = await db.query.userRatings.findFirst({
        where: eq(userRatings.userId, userId),
      })
      const newRank = newRating?.rank ?? null

      if (newRank && (oldRank === null || newRank < oldRank)) {
        const { notify } = await import("@/lib/services/notify")
        notify.rankChanged(userId, newRank)
      }
    } catch (rankError) {
      console.error("[addXp] Rank recalculation error (non-critical):", rankError)
    }

    return event
  } catch (error) {
    console.error("[addXp] Error:", error)
    throw error
  }
}

/** Пересчитать ранги всех пользователей на основе totalXp */
export async function recalculateRanks(): Promise<void> {
  try {
    await db.execute(sql`
      UPDATE user_ratings
      SET rank = ranked.new_rank,
          updated_at = NOW()
      FROM (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY total_xp DESC) AS new_rank
        FROM user_ratings
      ) AS ranked
      WHERE user_ratings.user_id = ranked.user_id
    `)
  } catch (error) {
    console.error("[recalculateRanks] Error:", error)
    throw error
  }
}

/** Получить бейджи пользователя */
export async function getUserBadges(
  userId: string
): Promise<(SelectUserBadge & { badge: SelectBadge })[]> {
  try {
    const results = await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
      with: {
        badge: true,
      },
    })

    return results as (SelectUserBadge & { badge: SelectBadge })[]
  } catch (error) {
    console.error("[getUserBadges] Error:", error)
    throw error
  }
}

/** Выдать бейдж пользователю (если ещё не получен) */
export async function awardBadge(
  userId: string,
  badgeId: string
): Promise<SelectUserBadge | null> {
  try {
    // Check if already earned
    const existing = await db.query.userBadges.findFirst({
      where: and(
        eq(userBadges.userId, userId),
        eq(userBadges.badgeId, badgeId)
      ),
    })

    if (existing) {
      return null // Already earned
    }

    return await db.transaction(async (tx) => {
      const [badge] = await tx
        .insert(userBadges)
        .values({ userId, badgeId })
        .returning()

      // Increment badges count in user_ratings
      await tx
        .update(userRatings)
        .set({
          badgesCount: sql`${userRatings.badgesCount} + 1`,
        })
        .where(eq(userRatings.userId, userId))

      return badge
    })
  } catch (error) {
    console.error("[awardBadge] Error:", error)
    throw error
  }
}
