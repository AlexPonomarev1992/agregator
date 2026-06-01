import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  experiments,
  userExperiments,
  xpEvents,
  userRatings,
} from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, notFound, apiError } from "@/lib/api/response";
import { checkAndAwardBadges } from "@/lib/services/badges";
import { notify } from "@/lib/services/notify";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/experiments/:id/complete
 * Завершить эксперимент. Начисляет XP, создаёт xp_event, проверяет бейджи.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof NextResponse) return auth;
  const { userId } = auth;

  try {
    const { id: experimentId } = await context.params;

    // Check experiment exists
    const experiment = await db.query.experiments.findFirst({
      where: eq(experiments.id, experimentId),
    });

    if (!experiment) {
      return notFound("Эксперимент");
    }

    // Check user_experiment exists with status 'started'
    const userExp = await db.query.userExperiments.findFirst({
      where: and(
        eq(userExperiments.userId, userId),
        eq(userExperiments.experimentId, experimentId)
      ),
    });

    if (!userExp) {
      return apiError(
        "NOT_STARTED",
        "Эксперимент не начат",
        400
      );
    }

    if (userExp.status === "completed") {
      return apiError(
        "ALREADY_COMPLETED",
        "Эксперимент уже завершён",
        409
      );
    }

    // Transaction: update status, create xp_event, update totalXp
    const updated = await db.transaction(async (tx) => {
      // Update user_experiment status
      const [result] = await tx
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
        .returning();

      if (!result) {
        throw new Error("Failed to update experiment status");
      }

      // Create XP event
      await tx.insert(xpEvents).values({
        userId,
        amount: experiment.xpReward,
        reason: "experiment_complete",
        referenceId: experimentId,
      });

      // Update user_ratings totalXp
      await tx
        .update(userRatings)
        .set({
          totalXp: sql`${userRatings.totalXp} + ${experiment.xpReward}`,
        })
        .where(eq(userRatings.userId, userId));

      return result;
    });

    // Notification for experiment completion
    notify.experimentCompleted(userId, experiment.title, experiment.xpReward);

    // Check and award badges (outside transaction — not critical)
    try {
      await checkAndAwardBadges(userId);
    } catch (badgeError) {
      console.error("[POST /api/experiments/:id/complete] Badge check error:", badgeError);
    }

    return apiSuccess(updated);
  } catch (error) {
    console.error("[POST /api/experiments/:id/complete] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка завершения эксперимента", 500);
  }
}
