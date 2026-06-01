'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from '@/components/ui/icons'

const faqs = [
  {
    q: 'Что такое токены и как они работают?',
    a: 'Токены — это внутренняя валюта платформы. Каждая генерация стоит определённое количество токенов: фото — от 3 токенов, видео 5 сек — 20 токенов, ИИ-сообщение — 1 токен. Токены зачисляются ежемесячно по тарифу или можно купить дополнительные пакеты.',
  },
  {
    q: 'Сгорают ли токены в конце месяца?',
    a: 'Нет. На платных тарифах (Starter, Creator, Pro) токены накапливаются — неиспользованные переносятся на следующий месяц (rollover), но не более двойного лимита. На Free токены выдаются один раз и не сгорают 90 дней.',
  },
  {
    q: 'Какие нейросети доступны на платформе?',
    a: 'Для видео: Kling 2.6, Runway Gen-4, Veo 3, Sora. Для фото: Midjourney, Flux Pro, DALL·E 3, Nano Banana. Для текста: Claude 4.5, GPT-4o, Gemini 2.5, 200+ моделей через OpenRouter. Для аудио: ElevenLabs, Stable Audio.',
  },
  {
    q: 'Могу ли я попробовать платформу бесплатно?',
    a: 'Да! При регистрации ты получаешь 50 бесплатных токенов — без карты, без обязательств. Этого хватит на 2 коротких видео или 16 HD-фотографий. Также доступен 7-дневный пробный период тарифа Creator.',
  },
  {
    q: 'Как работает реферальная программа?',
    a: 'За каждого друга, которого ты пригласил, ты получаешь 50 токенов после его регистрации. Плюс +20% от первой покупки друга в виде токенов. Друг получает +50 приветственных токенов вместо стандартных 0.',
  },
  {
    q: 'Можно ли отменить подписку?',
    a: 'Да, в любой момент в настройках аккаунта. После отмены подписка активна до конца оплаченного периода. Накопленные токены остаются на счёте 90 дней.',
  },
  {
    q: 'Какие способы оплаты доступны?',
    a: 'Рубли — через Т-Банк Acquiring (карты Visa, Mastercard, МИР). Доллары/евро — через Paddle (международные карты). Криптовалюта — USDT и TON через Cryptomus. ЮMoney для RU-пользователей.',
  },
  {
    q: 'Что такое RoyalPass?',
    a: 'RoyalPass — подписка, которая открывает расширенный доступ: видеоуроки по вайбкодингу, еженедельные созвоны с командой, закрытый Telegram-чат, бонусные эксперименты и эксклюзивные бейджи. Входит в тариф Creator и выше.',
  },
]

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            FAQ
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Частые вопросы
          </h2>
        </div>

        {/* Accordion */}
        <div className="flex flex-col divide-y divide-white/5">
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-sm font-medium text-white/80 hover:text-white transition-colors">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-sm leading-relaxed text-white/40">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
