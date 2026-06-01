import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, notFound, forbidden, validationError } from "@/lib/api/response";
import {
  getProjectById,
  getProjectMessages,
  updateProject,
  archiveProject,
} from "@/lib/db/queries/projects";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/projects/[id] — получить проект с последними сообщениями */
export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const { id } = await context.params;

  try {
    const project = await getProjectById(id);
    if (!project) return notFound("Проект");
    if (project.userId !== userId) return forbidden();

    const messages = await getProjectMessages(id, 50);

    return apiSuccess({ ...project, messages });
  } catch (error) {
    console.error("[GET /api/projects/[id]] Error:", error);
    return notFound("Проект");
  }
}

/** PATCH /api/projects/[id] — обновить поля проекта */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const { id } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return validationError("Невалидный JSON в теле запроса");
  }

  try {
    const project = await getProjectById(id);
    if (!project) return notFound("Проект");
    if (project.userId !== userId) return forbidden();

    // Фильтруем только допустимые поля
    const allowedFields = [
      "name",
      "description",
      "context",
      "modelId",
      "personaId",
    ] as const;

    const updateData: Record<string, string | undefined> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field] as string | undefined;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return validationError("Нет полей для обновления");
    }

    const updated = await updateProject(id, updateData);
    return apiSuccess(updated);
  } catch (error) {
    console.error("[PATCH /api/projects/[id]] Error:", error);
    return notFound("Проект");
  }
}

/** DELETE /api/projects/[id] — архивировать проект */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const { id } = await context.params;

  try {
    const project = await getProjectById(id);
    if (!project) return notFound("Проект");
    if (project.userId !== userId) return forbidden();

    const archived = await archiveProject(id);
    return apiSuccess(archived);
  } catch (error) {
    console.error("[DELETE /api/projects/[id]] Error:", error);
    return notFound("Проект");
  }
}
