import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { requireAuth } from "@/lib/api/auth-guard";
import { apiSuccess, validationError } from "@/lib/api/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = "/tmp/vibelab-uploads";
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm", "pdf"]);

/** POST /api/upload — загрузить файл */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth instanceof Response) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return validationError("Файл обязателен (поле 'file')");
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return validationError(
        `Файл слишком большой. Максимум: ${MAX_FILE_SIZE / 1024 / 1024}MB`
      );
    }

    // Validate file extension
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return validationError(
        `Недопустимое расширение файла: .${ext}. Разрешены: ${[...ALLOWED_EXTENSIONS].join(", ")}`
      );
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Generate unique filename
    const fileId = crypto.randomUUID();
    const filename = `${fileId}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Build URL path (R2 integration later — for now local path)
    const url = `/api/upload/${filename}`;

    return apiSuccess({
      id: fileId,
      name: file.name,
      url,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("[POST /api/upload] Error:", error);
    return validationError("Ошибка при загрузке файла");
  }
}
