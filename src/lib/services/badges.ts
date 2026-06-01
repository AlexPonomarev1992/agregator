import { eq, and, count, desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  badges,
  userBadges,
  userExperiments,
  userRatings,
  experiments,
  subscriptions,
  generations,
  users,
} from "@/lib/db/schema";
import { awardBadge } from "@/lib/db/queries";
import { notify } from "@/lib/services/notify";

// Badge name to condition checker mapping (matched by badge name from DB)
const BADGE_CHECKERS: Record<string, (userId: string) => Promise<boolean>> = {
  // "Первопроходец" — has at least 1 completed experiment
  "Первопроходец": async (userId: string) => {
    const result = await db
      .select({ cnt: count() })
      .from(userExperiments)
      .where(
        and(
          eq(userExperiments.userId, userId),
          eq(userExperiments.status, "completed")
        )
      );
    return result[0].cnt >= 1;
  },

  // "Восходящая звезда" — totalXp >= 500
  "Восходящая звезда": async (userId: string) => {
    const rating = await db.query.userRatings.findFirst({
      where: eq(userRatings.userId, userId),
    });
    return (rating?.totalXp ?? 0) >= 500;
  },

  // "Ракета" — totalXp >= 2000
  "Ракета": async (userId: string) => {
    const rating = await db.query.userRatings.findFirst({
      where: eq(userRatings.userId, userId),
    });
    return (rating?.totalXp ?? 0) >= 2000;
  },

  // "Королевская особа" — has active subscription
  "Королевская особа": async (userId: string) => {
    const activeSub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      ),
    });
    return !!activeSub;
  },

  // "Мастер генераций" — 100+ total generations
  "Мастер генераций": async (userId: string) => {
    const result = await db
      .select({ cnt: count() })
      .from(generations)
      .where(eq(generations.userId, userId));
    return result[0].cnt >= 100;
  },

  // "Ветеран" — account age >= 3 months
  "Ветеран": async (userId: string) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { createdAt: true },
    });
    if (!user) return false;

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return user.createdAt <= threeMonthsAgo;
  },

  // "Молния" — 10 generations in one day
  "Молния": async (userId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [result] = await db
      .select({ cnt: count() })
      .from(generations)
      .where(
        and(
          eq(generations.userId, userId),
          gte(generations.createdAt, todayStart)
        )
      );
    return result.cnt >= 10;
  },

  // "Чемпион" — rank in top 3
  "Чемпион": async (userId: string) => {
    const rating = await db.query.userRatings.findFirst({
      where: eq(userRatings.userId, userId),
    });
    return rating?.rank != null && rating.rank <= 3;
  },

  // "Снайпер" — 5 consecutive successful generations
  "Снайпер": async (userId: string) => {
    const lastFive = await db
      .select({ status: generations.status })
      .from(generations)
      .where(eq(generations.userId, userId))
      .orderBy(desc(generations.createdAt))
      .limit(5);

    if (lastFive.length < 5) return false;
    return lastFive.every((g) => g.status === "done");
  },

  // "Бриллиант" — completed all published experiments
  "Бриллиант": async (userId: string) => {
    const [publishedResult] = await db
      .select({ cnt: count() })
      .from(experiments)
      .where(eq(experiments.isPublished, true));

    if (publishedResult.cnt === 0) return false;

    const [completedResult] = await db
      .select({ cnt: count() })
      .from(userExperiments)
      .where(
        and(
          eq(userExperiments.userId, userId),
          eq(userExperiments.status, "completed")
        )
      );

    return completedResult.cnt >= publishedResult.cnt;
  },
};

/**
 * Проверяет все условия бейджей и выдаёт новые.
 * Вызывается после завершения эксперимента или других действий, влияющих на бейджи.
 */
export async function checkAndAwardBadges(userId: string): Promise<void> {
  try {
    const allBadges = await db.query.badges.findMany();

    const earnedBadges = await db.query.userBadges.findMany({
      where: eq(userBadges.userId, userId),
    });
    const earnedBadgeIds = new Set(earnedBadges.map((ub) => ub.badgeId));

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) continue;

      // Match by badge name
      const checker = BADGE_CHECKERS[badge.name];
      if (!checker) continue;

      const conditionMet = await checker(userId);
      if (conditionMet) {
        const awarded = await awardBadge(userId, badge.id);
        if (awarded) {
          notify.badgeEarned(userId, badge.name, badge.id);
        }
      }
    }
  } catch (error) {
    console.error("[checkAndAwardBadges] Error:", error);
    throw error;
  }
}
