'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Tab = 'video' | 'photo' | 'text' | 'audio'

const tabs: { id: Tab; label: string }[] = [
  { id: 'video', label: 'Видео' },
  { id: 'photo', label: 'Фото' },
  { id: 'text', label: 'Текст / ИИ' },
  { id: 'audio', label: 'Аудио' },
]

const models: Record<Tab, { name: string; desc: string; tag?: string }[]> = {
  video: [
    { name: 'Kling 2.6', desc: 'Реалистичное видео до 10 сек. Лучшее качество движения', tag: 'Топ' },
    { name: 'Runway Gen-4', desc: 'Художественные видео с точным следованием промпту' },
    { name: 'Veo 3', desc: 'Google DeepMind — фотореализм нового уровня' },
    { name: 'Sora', desc: 'OpenAI — длинные сцены до 60 сек' },
  ],
  photo: [
    { name: 'Midjourney', desc: 'Художественные и концептуальные изображения', tag: 'Топ' },
    { name: 'Flux Pro', desc: 'Фотореализм и коммерческий контент' },
    { name: 'DALL·E 3', desc: 'Точное следование текстовому описанию' },
    { name: 'Nano Banana', desc: 'Аватары, маскоты, брендинговый контент' },
  ],
  text: [
    { name: 'Claude 4.5', desc: 'Лучший для длинных текстов и кода', tag: 'Топ' },
    { name: 'GPT-4o', desc: 'Универсальный помощник и мультимодальный анализ' },
    { name: 'Gemini 2.5', desc: 'Google — длинный контекст до 2M токенов' },
    { name: 'OpenRouter', desc: 'Доступ к 200+ моделям через один API' },
  ],
  audio: [
    { name: 'ElevenLabs', desc: 'Реалистичный голос и клонирование голоса', tag: 'Топ' },
    { name: 'Stable Audio', desc: 'Музыка и звуковые эффекты по промпту' },
    { name: 'Whisper', desc: 'Транскрипция аудио и видео в текст' },
    { name: 'Voice Cloning', desc: 'Создай свой уникальный голос за 30 сек' },
  ],
}

export function ModelsShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('video')

  return (
    <section id="models" className="bg-black px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Нейросети
          </p>
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Топовые модели в одном месте
          </h2>
        </div>

        {/* Tabs */}
        <div className="mb-10 flex justify-center gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1 max-w-sm mx-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-black'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Model cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {models[activeTab].map((model) => (
              <div
                key={model.name}
                className="group flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
              >
                {/* Model avatar */}
                <div className="flex items-center justify-between">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <span className="text-xs font-bold text-white/60">
                      {model.name.charAt(0)}
                    </span>
                  </div>
                  {model.tag && (
                    <span className="rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/50">
                      {model.tag}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{model.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-white/40">{model.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
