import { db } from "./index";
import { badges, experiments } from "./schema";

/**
 * Seed script: вставляет начальные данные бейджей и экспериментов.
 * Запуск: DATABASE_URL=... npx tsx src/lib/db/seed.ts
 */
async function seed() {
  console.log("Seeding badges...");

  const badgeData = [
    { name: "Первопроходец", description: "Завершить первый эксперимент", icon: "Flame", condition: { type: "experiment_count", value: 1 } },
    { name: "Молния", description: "Сделать 10 генераций за один день", icon: "Zap", condition: { type: "daily_generations", value: 10 } },
    { name: "Чемпион", description: "Попасть в топ-3 рейтинга", icon: "Trophy", condition: { type: "rank", value: 3 } },
    { name: "Восходящая звезда", description: "Набрать 500 XP", icon: "Star", condition: { type: "xp", value: 500 } },
    { name: "Ракета", description: "Набрать 2000 XP", icon: "Rocket", condition: { type: "xp", value: 2000 } },
    { name: "Королевская особа", description: "Оформить подписку RoyalPass", icon: "Crown", condition: { type: "subscription", value: true } },
    { name: "Снайпер", description: "Получить 5 генераций со статусом done подряд", icon: "Target", condition: { type: "consecutive_success", value: 5 } },
    { name: "Мастер генераций", description: "Сделать 100 генераций", icon: "Award", condition: { type: "generation_count", value: 100 } },
    { name: "Ветеран", description: "Быть на платформе больше 3 месяцев", icon: "Medal", condition: { type: "account_age_months", value: 3 } },
    { name: "Бриллиант", description: "Завершить все опубликованные эксперименты", icon: "Diamond", condition: { type: "all_experiments", value: true } },
  ];

  for (const badge of badgeData) {
    await db
      .insert(badges)
      .values({
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        condition: badge.condition,
      })
      .onConflictDoNothing();
  }
  console.log(`  Inserted ${badgeData.length} badges`);

  console.log("Seeding experiments...");

  const experimentData = [
    { title: "А что если сделать видео без единого слова?", description: "Создайте короткое видео, которое передаёт эмоцию только через визуальные образы и музыку. Никакого текста и диалогов.", xpReward: 50, isPublished: true, order: 1 },
    { title: "А что если смешать стили двух эпох?", description: "Объедините эстетику Ренессанса и киберпанка в одном изображении. Как бы выглядела Мона Лиза в 2077 году?", xpReward: 75, isPublished: true, order: 2 },
    { title: "А что если рисовать только светом?", description: "Сгенерируйте серию из 3 изображений, где главный элемент — свет. Никаких чётких объектов, только игра света и тени.", xpReward: 60, isPublished: true, order: 3 },
    { title: "А что если создать маскота из обычного предмета?", description: "Превратите бытовой предмет (чайник, лампу, зонт) в живого персонажа с характером и историей.", xpReward: 100, isPublished: true, order: 4 },
    { title: "А что если показать один день за 10 секунд?", description: "Создайте видео-таймлапс целого дня: от рассвета до заката. Используйте генерацию для каждой фазы дня.", xpReward: 80, isPublished: true, order: 5 },
    { title: "А что если генерировать по случайным словам?", description: "Возьмите три случайных слова и создайте из них связную визуальную историю. Чем неожиданнее комбинация — тем лучше!", xpReward: 25, isPublished: true, order: 6 },
  ];

  for (const exp of experimentData) {
    await db
      .insert(experiments)
      .values(exp)
      .onConflictDoNothing();
  }
  console.log(`  Inserted ${experimentData.length} experiments`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
