import { eq, and, sql } from "drizzle-orm"
import { db } from "../index"
import {
  experiments,
  userExperiments,
  xpEvents,
  userRatings,
  type SelectExperiment,
  type SelectUserExperiment,
} from "../schema"

/** Получить опубликованные эксперименты, упорядоченные по полю order */
export async function getPublishedExperiments(): Promise<SelectExperiment[]> {
  try {
    return await db.query.experiments.findMany({
      where: eq(experiments.isPublished, true),
      orderBy: experiments.order,
    })
  } catch (error) {
    console.error("[getPublishedExperiments] Error:", error)
    throw error
  }
}

/** Получить прогресс пользователя по экспериментам */
export async function getUserExperiments(
  userId: string
): Promise<(SelectUserExperiment & { experiment: SelectExperiment })[]> {
  try {
    const results = await db.query.userExperiments.findMany({
      where: eq(userExperiments.userId, userId),
      with: {
        experiment: true,
      },
    })

    return results as (SelectUserExperiment & {
      experiment: SelectExperiment
    })[]
  } catch (error) {
    console.error("[getUserExperiments] Error:", error)
    throw error
  }
}

/** Начать эксперимент — создать запись user_experiment со статусом 'started' */
export async function startExperiment(
  userId: string,
  experimentId: string
): Promise<SelectUserExperiment> {
  try {
    // Check if already started
    const existing = await db.query.userExperiments.findFirst({
      where: and(
        eq(userExperiments.userId, userId),
        eq(userExperiments.experimentId, experimentId)
      ),
    })

    if (existing) {
      return existing
    }

    const [userExperiment] = await db
      .insert(userExperiments)
      .values({
        userId,
        experimentId,
        status: "started",
      })
      .returning()

    return userExperiment
  } catch (error) {
    console.error("[startExperiment] Error:", error)
    throw error
  }
}

/** Завершить эксперимент — обновить статус, начислить XP */
export async function completeExperiment(
  userId: string,
  experimentId: string
): Promise<SelectUserExperiment> {
  try {
    return await db.transaction(async (tx) => {
      // Get experiment to know XP reward
      const experiment = await tx.query.experiments.findFirst({
        where: eq(experiments.id, experimentId),
      })

      if (!experiment) {
        throw new Error(`Experiment not found: ${experimentId}`)
      }

      // Update user_experiment status
      const [updated] = await tx
        .update(userExperiments)
        .set({
          status: "completed",
          xpEarned: experiment.xpReward,
          completedAt: new Date(),
        })
        .where(
          and(
            eq(userExperiments.userId, userId),
            eq(userExperiments.experimentId, experimentId),
            eq(userExperiments.status, "started")
          )
        )
        .returning()

      if (!updated) {
        throw new Error(
          "Experiment not started or already completed"
        )
      }

      // Create XP event
      await tx.insert(xpEvents).values({
        userId,
        amount: experiment.xpReward,
        reason: "experiment_complete",
        referenceId: experimentId,
      })

      // Update user_ratings totalXp
      await tx
        .update(userRatings)
        .set({
          totalXp: sql`${userRatings.totalXp} + ${experiment.xpReward}`,
        })
        .where(eq(userRatings.userId, userId))

      return updated
    })
  } catch (error) {
    console.error("[completeExperiment] Error:", error)
    throw error
  }
}
