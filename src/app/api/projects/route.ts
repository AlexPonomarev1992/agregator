import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth-guard";
import { validateBody } from "@/lib/api/validate";
import { createProjectSchema } from "@/lib/api/validation";
import { apiSuccess } from "@/lib/api/response";
import {
  getProjectsByUser,
  createProject,
} from "@/lib/db/queries/projects";

/** GET /api/projects — получить проекты пользователя (не архивные) */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  try {
    const projects = await getProjectsByUser(userId);
    return apiSuccess(projects);
  } catch (error) {
    console.error("[GET /api/projects] Error:", error);
    return apiSuccess([]);
  }
}

/** POST /api/projects — создать новый проект */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;
  const { userId } = auth;

  const body = await validateBody(request, createProjectSchema);
  if (body instanceof Response) return body;

  try {
    const project = await createProject({
      userId,
      name: body.name,
      description: body.description,
      context: body.context,
      modelId: body.modelId,
      personaId: body.personaId,
    });

    return apiSuccess(project);
  } catch (error) {
    console.error("[POST /api/projects] Error:", error);
    return apiSuccess(null);
  }
}
