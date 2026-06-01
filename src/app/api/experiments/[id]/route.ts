import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { experiments } from "@/lib/db/schema";
import { apiSuccess, notFound, apiError } from "@/lib/api/response";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/experiments/:id [public]
 * Детали одного эксперимента.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const experiment = await db.query.experiments.findFirst({
      where: eq(experiments.id, id),
    });

    if (!experiment) {
      return notFound("Эксперимент");
    }

    return apiSuccess(experiment);
  } catch (error) {
    console.error("[GET /api/experiments/:id] Error:", error);
    return apiError("INTERNAL_ERROR", "Ошибка загрузки эксперимента", 500);
  }
}
