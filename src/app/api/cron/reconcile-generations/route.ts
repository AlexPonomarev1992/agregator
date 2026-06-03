import { NextRequest } from "next/server"
import { apiSuccess, apiError } from "@/lib/api/response"
import { reconcileRunningGenerations } from "@/lib/studio/reconcile"

// Node runtime — нужен внешний fetch к KIE без edge-ограничений.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * POST /api/cron/reconcile-generations
 * Фоновый досмотр незавершённых генераций: дергает KIE и финализирует статусы
 * НЕЗАВИСИМО от клиента (вкладка закрыта / телефон выключен).
 *
 * Защита: заголовок `Authorization: Bearer <CRON_SECRET>` либо Vercel Cron
 * (`x-vercel-cron`). Вешать на расписание раз в ~30-60 секунд.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get("authorization")
  const isVercelCron = request.headers.get("x-vercel-cron") !== null
  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return apiError("UNAUTHORIZED", "Invalid cron secret", 401)
  }

  try {
    const result = await reconcileRunningGenerations(100)
    return apiSuccess(result)
  } catch (error) {
    console.error("[cron/reconcile-generations] Error:", error)
    return apiError("INTERNAL_ERROR", "Reconcile failed", 500)
  }
}

// Разрешаем GET для ручной проверки/некоторых cron-провайдеров.
export const GET = POST
