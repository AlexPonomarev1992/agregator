'use client';

import { Video } from '@/components/ui/icons';
import { AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { GenerationCard } from './GenerationCard';
import type { Generation } from '@/types';

interface GenerationHistoryProps {
  generations: Generation[];
  onSelectGeneration: (generation: Generation) => void;
}

export function GenerationHistory({ generations, onSelectGeneration }: GenerationHistoryProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium text-white/80">История</h3>
        <Badge variant="default" className="text-[10px] px-1.5 py-0">
          {generations.length}
        </Badge>
      </div>

      {/* List */}
      {generations.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-white/20">
          <Video className="h-10 w-10" />
          <p className="text-sm text-center">Здесь появятся ваши генерации</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-1 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {generations.map((generation) => (
              <GenerationCard
                key={generation.id}
                generation={generation}
                onClick={() => onSelectGeneration(generation)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
