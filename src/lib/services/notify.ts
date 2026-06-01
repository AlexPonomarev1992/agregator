import { createNotification } from "@/lib/db/queries/notifications"

/** Non-blocking notification helper — never throws, logs errors */
function send(data: Parameters<typeof createNotification>[0]): void {
  createNotification(data).catch((err) =>
    console.error("[notify] Failed:", err)
  )
}

export const notify = {
  badgeEarned(userId: string, badgeName: string, badgeId?: string) {
    send({
      userId,
      type: "badge",
      title: "Новый бейдж",
      description: `Вы получили бейдж "${badgeName}"`,
      iconName: "Award",
      referenceId: badgeId,
    })
  },

  generationDone(userId: string, type: "video" | "photo", prompt: string, generationId?: string) {
    send({
      userId,
      type: "generation",
      title: "Генерация завершена",
      description: `${type === "video" ? "Видео" : "Фото"} "${prompt.slice(0, 40)}${prompt.length > 40 ? "..." : ""}" готово`,
      iconName: type === "video" ? "Video" : "Image",
      referenceId: generationId,
    })
  },

  rankChanged(userId: string, newRank: number) {
    send({
      userId,
      type: "rank",
      title: "Ранг повысился",
      description: `Ваш ранг повысился до #${newRank} в рейтинге`,
      iconName: "TrendingUp",
    })
  },

  creditsAdded(userId: string, amount: number) {
    send({
      userId,
      type: "credits",
      title: "Кредиты зачислены",
      description: `На ваш баланс зачислено ${amount} кредитов`,
      iconName: "Coins",
    })
  },

  subscriptionActivated(userId: string, plan: string) {
    send({
      userId,
      type: "subscription",
      title: "RoyalPass активен",
      description: `Ваша подписка RoyalPass (${plan === "yearly" ? "годовая" : "месячная"}) активирована`,
      iconName: "Crown",
    })
  },

  xpEarned(userId: string, amount: number, reason: string) {
    send({
      userId,
      type: "xp",
      title: `+${amount} XP`,
      description: reason,
      iconName: "Zap",
    })
  },

  experimentCompleted(userId: string, title: string, xp: number) {
    send({
      userId,
      type: "xp",
      title: "Эксперимент завершён",
      description: `"${title}" — получено ${xp} XP`,
      iconName: "Sparkles",
    })
  },
}
