import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { experiments, userExperiments, userRatings } from "@/lib/db/schema";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, notFound, apiError } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/experiments/:id/start
 * Начать эксперимент. Создаёт user_experiment со статусом 'started'.
 * Ошибка если уже начат.
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

    // Check if already started
    const existing = await db.query.userExperiments.findFirst({
      where: and(
        eq(userExperiments.userId, userId),
        eq(userExperiments.experimentId, experimentId)
      ),
    });

    if (existing) {
      return apiError(
        "ALREADY_STARTED",
        "Эксперимент уже начат",
        409
      );
    }

    // Ensure user_ratings row exists
    const existingRating = await db.query.userRatings.findFirst({
      where: eq(userRatings.userId, userId),
    });

    if (!existingRating) {
      await db.insert(userRatings).values({ userId });
    }

    // Create user_experiment
    const [userExperiment] = await db
      .insert(userExperiments)
      .values({
        userId,
        experimentId,
        status: "started",
      })
      .returning();

    return apiSuccess(userExperiment);
  } catch (error) {
    console.error("[POST /api/experiments/:id/start] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка начала эксперимента", 500);
  }
}
