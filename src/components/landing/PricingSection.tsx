'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Check } from '@/components/ui/icons'

const plans = [
  {
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    tokens: '50 токенов',
    tokenNote: 'единоразово при регистрации',
    rollover: false,
    highlight: false,
    features: [
      '50 токенов на старте',
      'Генерация фото и видео',
      'ИИ-чат (10 сообщений/день)',
      'Базовые эксперименты',
    ],
    cta: 'Начать бесплатно',
    href: '/signup',
  },
  {
    name: 'Starter',
    price: { monthly: 299, yearly: 239 },
    tokens: '200 токенов',
    tokenNote: 'в месяц + rollover',
    rollover: true,
    highlight: false,
    features: [
      '200 токенов/месяц',
      'Rollover до 400 токенов',
      'Все инструменты генерации',
      'ИИ-агент без лимита',
      'Все эксперименты',
    ],
    cta: 'Выбрать',
    href: '/signup?plan=starter',
  },
  {
    name: 'Creator',
    price: { monthly: 799, yearly: 639 },
    tokens: '600 токенов',
    tokenNote: 'в месяц + rollover',
    rollover: true,
    highlight: true,
    features: [
      '600 токенов/месяц',
      'Rollover до 1200 токенов',
      'Приоритетная генерация',
      'Контент-инструменты',
      'Автопостинг',
      'RoyalPass доступ',
    ],
    cta: 'Выбрать',
    href: '/signup?plan=creator',
  },
  {
    name: 'Pro',
    price: { monthly: 1999, yearly: 1599 },
    tokens: '2000 токенов',
    tokenNote: 'в месяц + rollover',
    rollover: true,
    highlight: false,
    features: [
      '2000 токенов/месяц',
      'Rollover до 4000 токенов',
      'Все тарифы Creator +',
      'API доступ',
      'Приоритетная поддержка',
      'Ранний доступ к новинкам',
    ],
    cta: 'Выбрать',
    href: '/signup?plan=pro',
  },
]

const topups = [
  { tokens: '100 токенов', price: '149 ₽' },
  { tokens: '500 токенов', price: '599 ₽' },
  { tokens: '2000 токенов', price: '1 999 ₽' },
]

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section id="pricing" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Тарифы
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Прозрачные цены
          </h2>
          <p className="mt-3 text-white/40">
            Токены не сгорают. Докупай в любой момент.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-lg px-4 py-1.5 text-sm transition-all ${
                billing === 'monthly' ? 'bg-white text-black font-medium' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`rounded-lg px-4 py-1.5 text-sm transition-all ${
                billing === 'yearly' ? 'bg-white text-black font-medium' : 'text-white/40 hover:text-white/70'
              }`}
            >
              Год
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-xs text-white/60">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className={`relative flex flex-col rounded-xl border p-6 ${
                plan.highlight
                  ? 'border-white bg-white/[0.04]'
                  : 'border-white/8 bg-white/[0.01]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-white/20 bg-black px-3 py-1 text-xs font-medium text-white">
                    Популярный
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white/60">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {billing === 'yearly' ? plan.price.yearly : plan.price.monthly}
                  </span>
                  {plan.price.monthly > 0 && (
                    <span className="text-sm text-white/30">₽/мес</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-white/40">
                  <span className="font-medium text-white/70">{plan.tokens}</span>{' '}
                  {plan.tokenNote}
                </p>
              </div>

              <ul className="mb-6 flex flex-col gap-2.5 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-white/50">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/60" />
                    {feat}
                  </li>
                ))}
              </ul>

              <motion.div whileTap={{ scale: 0.97 }}>
                <Link
                  href={plan.href}
                  className={`block w-full rounded-lg py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
                    plan.highlight
                      ? 'bg-white text-black'
                      : 'border border-white/10 text-white/70 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Top-up packs */}
        <div className="mt-12 rounded-xl border border-white/5 bg-white/[0.01] p-8">
          <h3 className="mb-6 text-center text-base font-semibold text-white">
            Дополнительные токены (Top-up)
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {topups.map((pack) => (
              <div
                key={pack.tokens}
                className="flex items-center justify-between rounded-lg border border-white/5 px-5 py-4"
              >
                <span className="text-sm font-medium text-white">{pack.tokens}</span>
                <span className="text-sm text-white/40">{pack.price}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-white/25">
            Токены не сгорают 90 дней для Free · Не сгорают никогда для платных тарифов
          </p>
        </div>

        {/* Generation costs table */}
        <div className="mt-8 overflow-hidden rounded-xl border border-white/5">
          <div className="border-b border-white/5 bg-white/[0.02] px-6 py-4">
            <h3 className="text-sm font-semibold text-white">Стоимость генераций в токенах</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-white/5 sm:grid-cols-4">
            {[
              { label: 'Фото (HD)', cost: '8 токенов' },
              { label: 'Видео 5 сек', cost: '20 токенов' },
              { label: 'Аватар', cost: '10 токенов' },
              { label: 'ИИ-чат', cost: '1 токен' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col gap-1 px-6 py-4">
                <span className="text-xs text-white/30">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.cost}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
