'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Зарегистрируйся',
    description: 'Создай аккаунт и получи 50 бесплатных токенов для первых генераций. Без карты.',
  },
  {
    number: '02',
    title: 'Выбери инструмент',
    description: 'Генератор видео и фото, ИИ-агент с ролями, игровые эксперименты или карусели для Instagram.',
  },
  {
    number: '03',
    title: 'Создавай и расти',
    description: 'Зарабатывай XP за каждое действие, поднимайся в рейтинге и получай бейджи и награды.',
  },
]

export function HowItWorksSection() {
  return (
    <section className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Как это работает
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Три шага до первого результата
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-px bg-white/5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex flex-col gap-5 bg-black px-8 py-10"
            >
              {/* Step number */}
              <span className="text-5xl font-black text-white/[0.06] tabular-nums">
                {step.number}
              </span>

              {/* Content */}
              <div>
                <h3 className="mb-2 text-base font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/40">{step.description}</p>
              </div>

              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-1/2 hidden h-px w-px -translate-y-1/2 sm:block">
                  <div className="h-px w-8 bg-white/10" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
