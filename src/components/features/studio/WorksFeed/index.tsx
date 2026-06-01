'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Image, Coins, Download, RefreshCw, ArrowUpRight } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Generation } from '@/types';

export interface VibeAsset {
  type: 'video' | 'image' | 'audio';
  url: string;
  generationId: string;
  mimeType: string;
  prompt?: string;
}

interface WorksFeedProps {
  userId: string;
  modelSlug?: string;
  onSelect?: (generation: Generation) => void;
  onDragToInput?: (asset: VibeAsset) => void;
  compact?: boolean;
}

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

type FeedFilter = 'all' | 'video' | 'image' | 'audio';

interface WorkCardProps {
  generation: Generation;
  onSelect?: (generation: Generation) => void;
  onDragToInput?: (asset: VibeAsset) => void;
  compact?: boolean;
}

function WorkCard({ generation, onSelect, onDragToInput, compact }: WorkCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const url = generation.result_url;
  const outputType = generation.type === 'video' ? 'video' : generation.type === 'photo' ? 'image' : 'audio';

  function getMimeType(): string {
    if (!url) return 'application/octet-stream';
    if (url.endsWith('.mp4') || url.endsWith('.webm')) return 'video/mp4';
    if (url.endsWith('.mp3') || url.endsWith('.wav')) return 'audio/mpeg';
    if (url.endsWith('.png')) return 'image/png';
    if (url.endsWith('.webp')) return 'image/webp';
    return 'image/jpeg';
  }

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    if (!url) return;
    setIsDragging(true);

    const asset: VibeAsset = {
      type: outputType,
      url,
      generationId: generation.id,
      mimeType: getMimeType(),
      prompt: generation.prompt,
    };

    // Set multiple data transfer formats for maximum compatibility
    e.dataTransfer.setData('text/plain', url);
    e.dataTransfer.setData('application/x-vibelab-asset', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  }

  function handleDragEnd() {
    setIsDragging(false);
  }

  function handleUseAsInput(e: React.MouseEvent) {
    e.stopPropagation();
    if (!url || !onDragToInput) return;
    onDragToInput({
      type: outputType,
      url,
      generationId: generation.id,
      mimeType: getMimeType(),
      prompt: generation.prompt,
    });
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibelab-${generation.id}`;
    a.target = '_blank';
    a.click();
  }

  const isSucceeded = generation.status === 'done';
  const hasThumbnail = isSucceeded && url;

  return (
    <div
      draggable={Boolean(hasThumbnail)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onSelect?.(generation)}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-white/5 border border-white/10 cursor-pointer select-none transition-transform duration-150',
        compact ? 'w-[120px] h-[80px] flex-shrink-0' : 'aspect-video',
        isDragging && 'opacity-50 scale-95 ring-2 ring-[#7F77DD]/50',
        hasThumbnail && 'cursor-grab active:cursor-grabbing',
        'hover:scale-105'
      )}
    >
      {/* Thumbnail / preview */}
      {hasThumbnail ? (
        outputType === 'video' ? (
          <video
            src={url}
            className="h-full w-full object-cover"
            muted
            loop
            preload="metadata"
            onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
            onMouseLeave={(e) => {
              const vid = e.currentTarget as HTMLVideoElement;
              vid.pause();
              vid.currentTime = 0;
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={generation.prompt.slice(0, 60)}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          {outputType === 'video' ? (
            <Video className="h-5 w-5 text-white/30" />
          ) : outputType === 'image' ? (
            <Image className="h-5 w-5 text-white/30" />
          ) : (
            <Coins className="h-5 w-5 text-white/30" />
          )}
        </div>
      )}

      {/* Status overlay for non-done */}
      {!isSucceeded && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-[10px] text-white/60 font-medium">
            {generation.status === 'failed' ? 'Ошибка' : 'В очереди...'}
          </span>
        </div>
      )}

      {/* Drag hint */}
      {hasThumbnail && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] text-white/60 bg-black/50 rounded px-1">drag</span>
        </div>
      )}

      {/* Hover action overlay */}
      {hasThumbnail && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5 gap-1">
          <button
            onClick={handleDownload}
            title="Скачать"
            className="flex items-center justify-center w-6 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Download className="h-3 w-3 text-white" />
          </button>
          {onDragToInput && (
            <button
              onClick={handleUseAsInput}
              title="Использовать как входные данные"
              className="flex items-center justify-center w-6 h-6 rounded bg-white/10 hover:bg-white/20 transition-colors"
            >
              <ArrowUpRight className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function WorksFeed({ userId, modelSlug, onSelect, onDragToInput, compact = true }: WorksFeedProps) {
  const [filter, setFilter] = useState<FeedFilter>('all');

  const queryKey = ['works-feed', userId, modelSlug, filter];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (filter !== 'all') params.set('type', filter);
      if (modelSlug) params.set('modelSlug', modelSlug);

      const res = await fetch(`/api/generate/history?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const json = await res.json();
      const items: ApiGeneration[] = json.data ?? [];
      return items.map(normalizeGeneration);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const generations = data ?? [];

  const FILTER_TABS: { id: FeedFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'video', label: 'Видео' },
    { id: 'image', label: 'Фото' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {/* Header with filters */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/50 uppercase tracking-wide">
          Мои работы
        </span>
        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={cn(
                'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                filter === tab.id
                  ? 'bg-[#7F77DD]/20 text-[#7F77DD]'
                  : 'text-white/40 hover:text-white/70'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn(
                'rounded-xl flex-shrink-0 bg-white/5',
                compact ? 'w-[120px] h-[80px]' : 'w-[160px] h-[100px]'
              )}
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="text-xs text-white/40 py-2">
          Не удалось загрузить историю
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && generations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <RefreshCw className="h-6 w-6 text-white/20 mb-2" />
          <p className="text-xs text-white/40">
            Ваши работы появятся здесь после первой генерации
          </p>
        </div>
      )}

      {/* Works scroll */}
      {!isLoading && generations.length > 0 && (
        <AnimatePresence>
          <div
            className={cn(
              'flex gap-2 overflow-x-auto pb-1',
              'scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]',
              '[&::-webkit-scrollbar]:hidden',
              'scroll-snap-x snap-mandatory'
            )}
          >
            {generations.map((gen, i) => (
              <motion.div
                key={gen.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
                className="snap-start"
              >
                <WorkCard
                  generation={gen}
                  onSelect={onSelect}
                  onDragToInput={onDragToInput}
                  compact={compact}
                />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
