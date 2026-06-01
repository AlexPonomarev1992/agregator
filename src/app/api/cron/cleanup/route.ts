import { NextRequest, NextResponse } from "next/server"
import { deleteOldGenerations } from "@/lib/db/queries/generations"

const CLEANUP_SECRET = process.env.CRON_SECRET || process.env.BETTER_AUTH_SECRET

/**
 * POST /api/cron/cleanup
 * Удаляет генерации старше 14 дней.
 * Защищён секретом — вызывать через cron или вручную:
 *   curl -X POST http://localhost:3005/api/cron/cleanup -H "Authorization: Bearer <secret>"
 */
export async function POST(request: NextRequest) {
  // Проверка секрета
  const auth = request.headers.get("authorization")
  const token = auth?.replace("Bearer ", "")

  if (!CLEANUP_SECRET || token !== CLEANUP_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const deleted = await deleteOldGenerations(14)

    return NextResponse.json({
      ok: true,
      deleted,
      message: `Удалено ${deleted} генераций старше 14 дней`,
    })
  } catch (error) {
    console.error("[cron/cleanup] Error:", error)
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 }
    )
  }
}
