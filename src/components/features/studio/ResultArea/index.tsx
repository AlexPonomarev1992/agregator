'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles } from '@/components/ui/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { GenerationProgress } from '../GenerationProgress';
import { ResultCard } from '../ResultCard';
import type { ActiveGeneration } from '@/lib/stores/studio-store';
import type { VibeAsset } from '../WorksFeed';
import type { Generation } from '@/types';

interface ResultAreaProps {
  activeGeneration: ActiveGeneration | null;
  onUseAsInput?: (url: string, type: 'video' | 'image' | 'audio') => void;
  onCancel?: () => void;
}

function PlaceholderState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] gap-4 p-6 text-center">
      {/* SVG Illustration */}
      <svg
        viewBox="0 0 120 80"
        className="w-32 h-24 text-white/10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        {/* Screen outline */}
        <rect x="10" y="10" width="100" height="60" rx="6" strokeDasharray="4 3" />
        {/* Sparkle center */}
        <path d="M60 30 L63 37 L70 40 L63 43 L60 50 L57 43 L50 40 L57 37 Z" strokeWidth="1.5" />
        {/* Arrow pointing left (toward form) */}
        <path d="M35 55 L20 55 M20 55 L26 50 M20 55 L26 60" strokeWidth="1.5" />
        <text x="38" y="58" fontSize="6" fill="currentColor" stroke="none" opacity="0.5">
          Заполните форму
        </text>
      </svg>

      <div className="space-y-1.5">
        <p className="text-sm font-medium text-white/40">Результат появится здесь</p>
        <p className="text-xs text-white/25">
          Заполните параметры слева и нажмите Сгенерировать
        </p>
      </div>
    </div>
  );
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

export function ResultArea({ activeGeneration, onUseAsInput, onCancel }: ResultAreaProps) {
  // If we have an active generation id that is running/queued, poll its status
  const isPolling =
    !!activeGeneration?.id &&
    (activeGeneration.status === 'queued' || activeGeneration.status === 'running');

  const { data: polledGen, isLoading: isPollingLoading } = useQuery<Generation | null>({
    queryKey: ['generation-status', activeGeneration?.id],
    queryFn: async () => {
      if (!activeGeneration?.id) return null;
      const res = await fetch(`/api/generate/status/${activeGeneration.id}`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const json = await res.json();
      return normalizeGeneration(json.data);
    },
    enabled: isPolling,
    refetchInterval: isPolling ? 3000 : false,
    staleTime: 0,
  });

  // No active generation → show placeholder
  if (!activeGeneration) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
        <PlaceholderState />
      </div>
    );
  }

  const currentStatus = polledGen?.status ?? activeGeneration.status;
  const resultUrls = polledGen?.result_url
    ? [polledGen.result_url]
    : (activeGeneration.resultUrls ?? []);

  // Running / queued
  if (currentStatus === 'queued' || currentStatus === 'running' || currentStatus === 'pending' || currentStatus === 'processing') {
    return (
      <div className="rounded-2xl overflow-hidden">
        {isPollingLoading && !polledGen ? (
          <Skeleton className="aspect-video w-full rounded-2xl bg-white/5" />
        ) : (
          <GenerationProgress
            status={currentStatus === 'queued' || currentStatus === 'pending' ? 'queued' : 'running'}
            onCancel={onCancel}
          />
        )}
      </div>
    );
  }

  // Failed
  if (currentStatus === 'failed') {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-2"
        >
          <p className="text-sm font-medium text-red-400">Генерация не удалась</p>
          <p className="text-xs text-white/40">
            {(activeGeneration as { error?: string }).error ?? 'Попробуйте ещё раз'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Succeeded — show result
  if ((currentStatus === 'done' || currentStatus === 'succeeded') && resultUrls.length > 0) {
    const generation: Generation = polledGen ?? {
      id: activeGeneration.id,
      user_id: '',
      type: 'video',
      status: 'done',
      prompt: activeGeneration.prompt ?? '',
      result_url: resultUrls[0] ?? null,
      credits_spent: 0,
      provider: 'kie',
      metadata: null,
      created_at: activeGeneration.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResultCard
          generation={generation}
          onUseAsInput={
            onUseAsInput
              ? (asset: VibeAsset) => onUseAsInput(asset.url, asset.type)
              : undefined
          }
        />
      </motion.div>
    );
  }

  // Fallback
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-2">
        <Sparkles className="h-6 w-6 text-white/20" />
        <p className="text-xs text-white/30">Ожидание результата...</p>
      </div>
    </div>
  );
}
