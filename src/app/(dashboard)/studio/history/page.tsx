'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Video, Image, Download } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserStore } from '@/lib/stores/user-store';
import { cn } from '@/lib/utils';
import type { Generation } from '@/types';

type HistoryFilter = 'all' | 'video' | 'photo' | 'done' | 'failed';

const FILTER_TABS: { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'video', label: 'Видео' },
  { id: 'photo', label: 'Изображения' },
  { id: 'done', label: 'Готовые' },
  { id: 'failed', label: 'Ошибки' },
];

interface ApiGeneration {
  id: string;
  userId?: string;
  user_id?: string;
  type: string;
  status: string;
  prompt: string;
  resultUrl?: string;
  result_url?: string | null;
  creditsSpent?: number;
  credits_spent?: number;
  provider: string;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function normalizeGeneration(api: ApiGeneration): Generation {
  return {
    id: api.id,
    user_id: api.userId ?? api.user_id ?? '',
    type: api.type as Generation['type'],
    status: api.status as Generation['status'],
    prompt: api.prompt,
    result_url: api.resultUrl ?? api.result_url ?? null,
    credits_spent: api.creditsSpent ?? api.credits_spent ?? 0,
    provider: api.provider as Generation['provider'],
    metadata: api.metadata ?? null,
    created_at: api.createdAt ?? api.created_at ?? '',
    updated_at: api.updatedAt ?? api.updated_at ?? '',
  };
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

interface HistoryCardProps {
  generation: Generation;
}

function HistoryCard({ generation }: HistoryCardProps) {
  const url = generation.result_url;
  const isVideo = generation.type === 'video';
  const isDone = generation.status === 'done';

  function handleDownload() {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibelab-${generation.id}`;
    a.target = '_blank';
    a.click();
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      {/* Preview */}
      <div className="relative aspect-video bg-zinc-900">
        {isDone && url ? (
          isVideo ? (
            <video
              src={url}
              className="w-full h-full object-cover"
              muted
              loop
              preload="metadata"
              onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
              onMouseLeave={(e) => {
                const v = e.currentTarget as HTMLVideoElement;
                v.pause();
                v.currentTime = 0;
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={generation.prompt.slice(0, 60)} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isVideo ? (
              <Video className="h-8 w-8 text-white/20" />
            ) : (
              <Image className="h-8 w-8 text-white/20" />
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            generation.status === 'done' && 'bg-emerald-500/20 text-emerald-400',
            generation.status === 'failed' && 'bg-red-500/20 text-red-400',
            (generation.status === 'pending' || generation.status === 'processing') && 'bg-yellow-500/20 text-yellow-400',
          )}>
            {generation.status === 'done' ? 'Готово' :
             generation.status === 'failed' ? 'Ошибка' :
             'В обработке'}
          </span>
        </div>

        {/* Hover actions */}
        {isDone && url && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Скачать
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <p className="text-xs text-white/70 line-clamp-2 leading-relaxed">{generation.prompt}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30">{formatDate(generation.created_at)}</span>
          {generation.credits_spent > 0 && (
            <span className="text-[10px] text-white/30">{generation.credits_spent} кр.</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StudioHistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const user = useUserStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['studio-history', filter, user?.id],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (filter === 'video' || filter === 'photo') {
        params.set('type', filter);
      }
      const res = await fetch(`/api/generate/history?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const items: ApiGeneration[] = json.data ?? [];
      const normalized = items.map(normalizeGeneration);

      // Client-side status filter
      if (filter === 'done') return normalized.filter((g) => g.status === 'done');
      if (filter === 'failed') return normalized.filter((g) => g.status === 'failed');
      return normalized;
    },
    staleTime: 30_000,
  });

  const generations = data ?? [];

  return (
    <div className="min-h-screen pb-20 px-4 md:px-6">
      {/* Header */}
      <div className="pt-8 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Clock className="h-6 w-6 text-white/40" />
          <h1 className="text-2xl font-bold text-white">История генераций</h1>
        </div>
        <p className="text-sm text-white/50 ml-9">Все ваши работы в одном месте</p>
      </div>

      {/* Filter tabs */}
      <div className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6">
        <div className="flex gap-1 overflow-x-auto scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                filter === tab.id
                  ? 'bg-[#7F77DD]/20 text-[#7F77DD] border border-[#7F77DD]/30'
                  : 'text-white/50 hover:text-white/80 border border-transparent hover:border-white/10'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-white/5">
              <Skeleton className="aspect-video w-full bg-white/5 animate-pulse" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-3 w-full bg-white/5 rounded animate-pulse" />
                <Skeleton className="h-3 w-2/3 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : generations.length === 0 ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Clock className="h-7 w-7 text-white/20" />
            </div>
            <p className="text-sm text-white/40 font-medium">Ничего не найдено</p>
            <p className="text-xs text-white/25">Создайте первую генерацию в Studio</p>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {generations.map((gen) => (
            <HistoryCard key={gen.id} generation={gen} />
          ))}
        </div>
      )}
    </div>
  );
}
