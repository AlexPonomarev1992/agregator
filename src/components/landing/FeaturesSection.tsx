'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: '✦',
    title: 'Генератор контента',
    description: 'Видео, фото, аватары и маскоты через Kling и Nano Banana. Шаблоны и пресеты для быстрого старта.',
  },
  {
    icon: '◈',
    title: 'ИИ-агент',
    description: 'Создавай проекты с контекстной памятью. Роли «маркетолог», «копирайтер», «разработчик» — готовые сотрудники.',
  },
  {
    icon: '⬡',
    title: 'Лаборатория',
    description: 'Игровые эксперименты, XP и награды за каждое действие. Учись, создавай и соревнуйся в рейтинге.',
  },
  {
    icon: '▦',
    title: 'Контент-инструменты',
    description: 'Карусели для Instagram, аватарная машина, маскоты. Готовые шаблоны без глубокого промптинга.',
  },
  {
    icon: '◎',
    title: 'Рейтинг и бейджи',
    description: 'XP за генерации, уроки и рекомендации. Leaderboard, достижения и партнёрская программа.',
  },
  {
    icon: '⇥',
    title: 'Автопостинг',
    description: 'Настрой контент-завод и публикуй автоматически в Telegram, ВКонтакте, YouTube и Instagram.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Возможности
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Всё что нужно для ИИ-контента
          </h2>
          <p className="mt-3 text-white/40">
            Замени 5 разных подписок одной платформой
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="group flex flex-col gap-4 bg-black p-8 transition-colors hover:bg-white/[0.02]"
            >
              <span className="text-2xl text-white/40 transition-colors group-hover:text-white/70">
                {feat.icon}
              </span>
              <h3 className="text-base font-semibold text-white">{feat.title}</h3>
              <p className="text-sm leading-relaxed text-white/40">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
