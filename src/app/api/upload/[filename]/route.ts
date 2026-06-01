import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = "/tmp/vibelab-uploads";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  pdf: "application/pdf",
};

interface RouteParams {
  params: Promise<{ filename: string }>;
}

/** GET /api/upload/[filename] — serve uploaded file */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { filename } = await params;

  // Sanitize filename — only allow uuid.ext pattern
  if (!/^[a-f0-9-]+\.\w+$/.test(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const filepath = join(UPLOAD_DIR, filename);

  try {
    const buffer = await readFile(filepath);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
