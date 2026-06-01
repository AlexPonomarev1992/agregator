'use client';

import { motion } from 'framer-motion';
import { Cpu, Wand2, Sparkles } from '@/components/ui/icons';

const STEPS = [
  {
    icon: Cpu,
    title: 'Выберите модель',
    description: 'Kling, Veo, Flux, Suno — все инструменты в одном месте',
  },
  {
    icon: Wand2,
    title: 'Опишите идею',
    description: 'Агент улучшит промпт и подберёт оптимальные параметры',
  },
  {
    icon: Sparkles,
    title: 'Получите результат',
    description: 'Видео, фото, музыка или озвучка — готово за секунды',
  },
];

export function WelcomeState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 py-2"
    >
      <p className="text-xs font-medium text-white/30 uppercase tracking-wide text-center">Как начать</p>
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/3 border border-white/8 text-center"
            >
              <div className="h-8 w-8 rounded-lg bg-[#7F77DD]/15 flex items-center justify-center">
                <Icon className="h-4 w-4 text-[#7F77DD]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/80">{step.title}</p>
                <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
