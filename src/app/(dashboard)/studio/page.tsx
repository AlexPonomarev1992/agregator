'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ModelCard } from '@/components/features/studio/ModelCard';
import { getAllModels } from '@/lib/models';
import type { ModelCategory, ModelProvider } from '@/lib/models';
import { STUDIO_UTILITIES, utilityToLink, type StudioUtility } from '@/lib/studio-utilities';
import { cn } from '@/lib/utils';

const CATEGORY_TABS: { id: ModelCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'video', label: 'Видео' },
  { id: 'image', label: 'Изображения' },
  { id: 'audio', label: 'Аудио' },
  { id: 'music', label: 'Музыка' },
  { id: 'utility', label: 'Утилиты' },
];

const PROVIDER_LABELS: Partial<Record<ModelProvider, string>> = {
  kling: 'Kling',
  google: 'Google',
  flux: 'Flux',
  suno: 'Suno',
  elevenlabs: 'ElevenLabs',
  bytedance: 'ByteDance',
};

export default function StudioPage() {
  const allModels = getAllModels();

  const [activeCategory, setActiveCategory] = useState<ModelCategory | 'all'>('all');
  const [activeProviders, setActiveProviders] = useState<Set<ModelProvider>>(new Set());
  const [search, setSearch] = useState('');

  // Derive available providers from current models
  const availableProviders = useMemo(() => {
    const providerSet = new Set<ModelProvider>();
    allModels.forEach((m) => providerSet.add(m.provider));
    return Array.from(providerSet);
  }, [allModels]);

  // Filter models
  const filteredModels = useMemo(() => {
    return allModels.filter((model) => {
      // Category filter
      if (activeCategory !== 'all' && model.category !== activeCategory) return false;

      // Provider filter
      if (activeProviders.size > 0 && !activeProviders.has(model.provider)) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !model.name.toLowerCase().includes(q) &&
          !model.description.toLowerCase().includes(q) &&
          !model.provider.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allModels, activeCategory, activeProviders, search]);

  // Show utilities when category is 'all' or 'utility'
  const visibleUtilities = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'utility') return [];
    if (activeProviders.size > 0) return [];
    if (!search.trim()) return STUDIO_UTILITIES;
    const q = search.toLowerCase();
    return STUDIO_UTILITIES.filter(
      (u) => u.name.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)
    );
  }, [activeCategory, activeProviders, search]);

  // When 'utility' tab is active, hide regular models entirely
  const modelsToRender = activeCategory === 'utility' ? [] : filteredModels;
  const isEmpty = modelsToRender.length === 0 && visibleUtilities.length === 0;

  function toggleProvider(provider: ModelProvider) {
    setActiveProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  }

  return (
    <div className="h-full overflow-y-auto pb-20">
      {/* Hero block */}
      <div className="px-4 pt-8 pb-6 md:px-6 md:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
            Studio — все модели генерации
          </h1>
          <p className="text-sm text-white/50 max-w-xl">
            Видео, изображения, музыка и аудио через лучшие AI-модели. Выберите модель и начните создавать.
          </p>
        </motion.div>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 space-y-3">
        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                activeCategory === tab.id
                  ? 'bg-[#7F77DD]/20 text-[#7F77DD] border border-[#7F77DD]/30'
                  : 'text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Provider chips + search */}
        <div className="flex items-center gap-2 flex-wrap">
          {availableProviders.map((provider) => (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors border',
                activeProviders.has(provider)
                  ? 'bg-white/15 text-white border-white/20'
                  : 'text-white/40 border-white/10 hover:border-white/20 hover:text-white/60'
              )}
            >
              {PROVIDER_LABELS[provider] ?? provider}
            </button>
          ))}

          <div className="flex-1 min-w-[160px] max-w-[280px] ml-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className={cn(
                  'w-full rounded-lg border border-white/10 bg-white/5 pl-8 pr-3 py-1.5 text-xs text-white',
                  'placeholder:text-white/30 focus:outline-none focus:border-[#7F77DD]/40 focus:ring-1 focus:ring-[#7F77DD]/20'
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Models grid */}
      <div className="px-4 md:px-6 py-6">
        <AnimatePresence mode="wait">
          {isEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                <Search className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/40 font-medium">Ничего не найдено</p>
              <p className="text-xs text-white/25">Попробуйте другой фильтр или поисковый запрос</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Utilities section */}
              {visibleUtilities.length > 0 && (
                <section>
                  <div className="mb-3 flex items-baseline gap-2">
                    <h2 className="text-sm font-semibold text-white/80">Инструменты</h2>
                    <span className="text-[11px] text-white/30">готовые сценарии под задачу</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleUtilities.map((util, i) => (
                      <motion.div
                        key={util.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                      >
                        <UtilityCard util={util} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {/* Regular models */}
              {modelsToRender.length > 0 && (
                <section>
                  {activeCategory === 'all' && visibleUtilities.length > 0 && (
                    <div className="mb-3 flex items-baseline gap-2">
                      <h2 className="text-sm font-semibold text-white/80">Все модели</h2>
                      <span className="text-[11px] text-white/30">{modelsToRender.length} шт.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {modelsToRender.map((model, i) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                      >
                        <ModelCard model={model} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Utility card ────────────────────────────────────────────────────────────

const UTILITY_BADGE_STYLES: Record<string, string> = {
  NEW: 'bg-emerald-500/20 text-emerald-300',
  POPULAR: 'bg-orange-500/20 text-orange-300',
  CHEAP: 'bg-green-500/20 text-green-300',
  TREND: 'bg-pink-500/20 text-pink-300',
  HOT: 'bg-red-500/20 text-red-300',
  '4K': 'bg-amber-500/20 text-amber-300',
  AUDIO: 'bg-cyan-500/20 text-cyan-300',
};

function UtilityCard({ util }: { util: StudioUtility }) {
  return (
    <Link
      href={utilityToLink(util)}
      className={cn(
        'group relative block overflow-hidden rounded-2xl',
        'bg-white/5 border border-white/10 hover:border-[#7F77DD]/40',
        'transition-all duration-200 hover:shadow-lg hover:shadow-[#7F77DD]/10'
      )}
    >
      <div className="relative aspect-video bg-gradient-to-br from-[#7F77DD]/20 via-purple-900/10 to-zinc-900 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={util.thumbnail}
          alt={util.name}
          className="h-full w-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute left-2 top-2">
          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[#7F77DD]/30 text-white backdrop-blur-sm">
            Инструмент
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white">{util.name}</h3>
        <p className="mt-1 text-xs text-white/40 line-clamp-2">{util.description}</p>
        {util.badges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {util.badges.map((b) => (
              <span
                key={b}
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                  UTILITY_BADGE_STYLES[b] ?? 'bg-white/10 text-white/50'
                )}
              >
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

// Skeleton fallback used if we ever switch to async
function StudioPageSkeleton() {
  return (
    <div className="px-4 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-white/5">
          <Skeleton className="aspect-video w-full bg-white/5 animate-pulse" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
            <Skeleton className="h-3 w-1/2 bg-white/5 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
