'use client';

import { cn } from '@/lib/utils';
import type { ModelBadge } from '@/lib/models';

interface ModelBadgeProps {
  badge: ModelBadge;
  className?: string;
}

const BADGE_STYLES: Record<ModelBadge, string> = {
  NEW: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POPULAR: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CHEAP: 'bg-green-500/20 text-green-400 border-green-500/30',
  '4K': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  AUDIO: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  BETA: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  HOT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export function ModelBadge({ badge, className }: ModelBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
        BADGE_STYLES[badge],
        className
      )}
    >
      {badge}
    </span>
  );
}
