'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { featuredModels } from '@/lib/mock/models';
import type { AIModel } from '@/types';

interface HeroCarouselProps {
  onSelectModel: (model: AIModel) => void;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function HeroCarousel({ onSelectModel }: HeroCarouselProps) {
  const [[current, direction], setCurrent] = useState<[number, number]>([0, 0]);

  const paginate = useCallback(
    (newDirection: number) => {
      setCurrent(([prev]) => {
        const next = (prev + newDirection + featuredModels.length) % featuredModels.length;
        return [next, newDirection];
      });
    },
    []
  );

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(() => paginate(1), 5000);
    return () => clearInterval(timer);
  }, [paginate]);

  const model = featuredModels[current];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative w-full"
          style={{ background: model.thumbnail }}
        >
          <div className="relative z-10 flex flex-col justify-end p-6 md:p-8 min-h-[200px] md:min-h-[240px] bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <p className="text-xs font-medium text-white/60 uppercase tracking-wide mb-1">
              {model.provider}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              {model.name}
            </h2>
            <p className="text-sm text-white/70 max-w-lg mb-3">
              {model.description}
            </p>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {model.tags.map((tag) => (
                <Badge key={tag} variant="purple" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              onClick={() => onSelectModel(model)}
              className="w-fit gap-2"
            >
              Открыть
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Left/Right arrows */}
      <button
        onClick={() => paginate(-1)}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {featuredModels.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent([idx, idx > current ? 1 : -1])}
            className={`h-1.5 rounded-full transition-all ${
              idx === current
                ? 'w-6 bg-white'
                : 'w-1.5 bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
