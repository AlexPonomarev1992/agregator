'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AgentMode } from '@/lib/stores/agent-store';

interface ModeSwitcherProps {
  value: AgentMode;
  onChange: (mode: AgentMode) => void;
}

interface ModeOption {
  id: AgentMode;
  label: string;
  placeholder: string;
}

export const MODES: ModeOption[] = [
  { id: 'chat', label: 'Чат', placeholder: 'Спросите что угодно или опишите задачу…' },
  { id: 'video', label: 'Видео', placeholder: 'Опишите видео, которое нужно создать…' },
  { id: 'image', label: 'Фото', placeholder: 'Опишите изображение или сцену…' },
  { id: 'music', label: 'Музыка', placeholder: 'Задайте настроение, стиль, инструменты…' },
  { id: 'tts', label: 'TTS', placeholder: 'Введите текст для озвучки…' },
  { id: 'utility', label: 'Утилиты', placeholder: 'Выберите готовый инструмент ниже…' },
];

export function ModeSwitcher({ value, onChange }: ModeSwitcherProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onChange(mode.id)}
          className={cn(
            'relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150',
            value === mode.id ? 'text-white' : 'text-white/50 hover:text-white/80'
          )}
        >
          {value === mode.id && (
            <motion.div
              layoutId="active-mode-pill"
              className="absolute inset-0 rounded-lg bg-[#7F77DD]/30 border border-[#7F77DD]/40"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
            />
          )}
          <span className="relative z-10">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}

export function getModeConfig(mode: AgentMode): ModeOption {
  return MODES.find((m) => m.id === mode) ?? MODES[0];
}
