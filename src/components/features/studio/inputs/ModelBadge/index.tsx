'use client';

import React from 'react';
import type { ModelBadge as ModelBadgeVariant } from '@/lib/models/types';
import { cn } from '@/lib/utils';

export interface ModelBadgeProps {
  variant: ModelBadgeVariant;
}

const BADGE_STYLES: Record<ModelBadgeVariant, string> = {
  NEW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POPULAR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  CHEAP: 'bg-green-500/20 text-green-400 border-green-500/30',
  '4K': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  AUDIO: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  BETA: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  HOT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const BADGE_LABELS: Record<ModelBadgeVariant, string> = {
  NEW: 'NEW',
  POPULAR: 'POPULAR',
  CHEAP: 'CHEAP',
  '4K': '4K',
  AUDIO: 'AUDIO',
  BETA: 'BETA',
  HOT: 'HOT',
};

export function ModelBadge({ variant }: ModelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
        BADGE_STYLES[variant],
        variant === 'HOT' && 'animate-pulse'
      )}
    >
      {BADGE_LABELS[variant]}
    </span>
  );
}
