'use client';

import { motion } from 'framer-motion';

interface Template {
  id: string;
  name: string;
  prompt: string;
  gradient: string;
}

const TEMPLATES: Template[] = [
  {
    id: 't1',
    name: 'Киберпанк город',
    prompt: 'Ночной город в стиле киберпанк, неоновые вывески на японском, дождь, отражения в лужах, кинематографичное освещение',
    gradient: 'from-purple-600 via-pink-500 to-cyan-400',
  },
  {
    id: 't2',
    name: 'Природа 4K',
    prompt: 'Горное озеро на рассвете, туман над водой, хвойный лес, золотой свет пробивается через деревья, фотореалистичный стиль 4K',
    gradient: 'from-emerald-500 via-teal-400 to-sky-500',
  },
  {
    id: 't3',
    name: 'Портрет в стиле аниме',
    prompt: 'Портрет персонажа в стиле аниме, большие выразительные глаза, яркие волосы, мягкое освещение, детализированный фон',
    gradient: 'from-rose-400 via-fuchsia-500 to-indigo-500',
  },
  {
    id: 't4',
    name: 'Рекламный ролик',
    prompt: 'Профессиональный рекламный ролик продукта, белый фон, мягкие тени, продукт в центре кадра, вращение камеры вокруг объекта',
    gradient: 'from-amber-400 via-orange-500 to-red-500',
  },
  {
    id: 't5',
    name: 'Абстракция',
    prompt: 'Абстрактная композиция из жидких форм, переливающиеся цвета, глубина резкости, объёмные фракталы, свечение частиц',
    gradient: 'from-violet-500 via-blue-500 to-teal-400',
  },
  {
    id: 't6',
    name: 'Ретро стиль',
    prompt: 'Сцена в стиле ретро 80-х, синтвейв эстетика, закат с градиентом пурпурного и оранжевого, неоновая сетка, пальмы',
    gradient: 'from-pink-500 via-purple-600 to-indigo-700',
  },
];

interface TemplateGridProps {
  onSelectTemplate: (prompt: string) => void;
}

export function TemplateGrid({ onSelectTemplate }: TemplateGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium text-white/60">Шаблоны</h3>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TEMPLATES.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectTemplate(template.prompt)}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md text-left transition-colors hover:border-white/20"
          >
            {/* Gradient thumbnail */}
            <div
              className={`h-24 w-full bg-gradient-to-br ${template.gradient} opacity-60 group-hover:opacity-80 transition-opacity`}
            />
            {/* Template name */}
            <div className="p-3">
              <span className="text-sm font-medium text-white/90">
                {template.name}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
