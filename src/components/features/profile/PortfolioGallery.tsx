'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Download, ExternalLink } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'video' | 'photo' | 'character';

// Generation types from API
type GenerationType = 'video' | 'photo' | 'avatar' | 'mascot';

interface ApiGeneration {
  id: string;
  userId: string;
  type: GenerationType;
  status: string;
  prompt: string;
  resultUrl: string | null;
  creditsSpent: number;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterPill {
  id: FilterType;
  label: string;
}

const FILTERS: FilterPill[] = [
  { id: 'all', label: 'Все' },
  { id: 'video', label: 'Видео' },
  { id: 'photo', label: 'Фото' },
  { id: 'character', label: 'Персонажи' },
];

const CHARACTER_TYPES: GenerationType[] = ['avatar', 'mascot'];

function matchesFilter(type: GenerationType, filter: FilterType): boolean {
  if (filter === 'all') return true;
  if (filter === 'character') return CHARACTER_TYPES.includes(type);
  return type === filter;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

export function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [generations, setGenerations] = useState<ApiGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadGenerations() {
      try {
        const res = await fetch('/api/generate/history?limit=50');
        if (res.ok) {
          const json = await res.json();
          const apiData: ApiGeneration[] = json.data ?? [];
          // Only show completed generations with resultUrl
          setGenerations(apiData.filter((g) => g.status === 'done' && g.resultUrl));
        }
      } catch (error) {
        console.error('[PortfolioGallery] Failed to load generations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadGenerations();
  }, []);

  const filteredGenerations = generations.filter((g) =>
    matchesFilter(g.type, activeFilter)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-white">Портфолио</h3>
        <Badge variant="purple">{generations.length}</Badge>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeFilter === filter.id
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {filteredGenerations.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12"
          >
            <p className="text-sm text-white/40">
              {generations.length === 0
                ? 'Пока нет завершённых генераций'
                : 'Нет генераций в этой категории'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3"
          >
            {filteredGenerations.map((gen, index) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ scale: 1.02 }}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md"
              >
                {/* Thumbnail */}
                <div className="relative h-[200px] overflow-hidden">
                  <img
                    src={gen.resultUrl ?? ''}
                    alt={gen.prompt}
                    className="h-full w-full object-cover"
                  />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <button className="rounded-full bg-white/10 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white">
                      <Heart className="h-4 w-4" />
                    </button>
                    <button className="rounded-full bg-white/10 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="rounded-full bg-white/10 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Bottom info */}
                <div className="p-3">
                  <p className="truncate text-xs text-white/70">{gen.prompt}</p>
                  <p className="mt-1 text-[10px] text-white/40">
                    {formatDate(gen.createdAt)}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
