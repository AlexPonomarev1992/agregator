'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Generation } from '@/types';

interface GenerationCardProps {
  generation: Generation;
  onClick: () => void;
}

function statusLabel(status: Generation['status']): string {
  const labels: Record<Generation['status'], string> = {
    pending: 'В очереди',
    processing: 'Генерация...',
    done: 'Готово',
    failed: 'Ошибка',
  };
  return labels[status];
}

function statusVariant(status: Generation['status']) {
  const map: Record<Generation['status'], 'warning' | 'purple' | 'success' | 'destructive'> = {
    pending: 'warning',
    processing: 'purple',
    done: 'success',
    failed: 'destructive',
  };
  return map[status];
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'только что';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} мин назад`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ч назад`;
  return `${Math.floor(seconds / 86400)} дн назад`;
}

export function GenerationCard({ generation, onClick }: GenerationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="flex gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 cursor-pointer transition-colors hover:bg-white/[0.08]"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
        {generation.status === 'done' && generation.result_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={generation.result_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : generation.status === 'processing' ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : (
          <div className="h-full w-full bg-white/5 rounded-lg" />
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between overflow-hidden">
        <p className="text-sm text-white/80 line-clamp-2 leading-snug">
          {generation.prompt}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant={statusVariant(generation.status)}
            className={
              generation.status === 'processing' ? 'animate-pulse' : ''
            }
          >
            {statusLabel(generation.status)}
          </Badge>
          <span className="text-[11px] text-white/30">
            {timeAgo(generation.created_at)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
