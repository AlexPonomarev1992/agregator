'use client';

import { Play, Clock, Coins, Cpu } from '@/components/ui/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Generation } from '@/types';

interface GenerationPreviewProps {
  generation: Generation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function statusLabel(status: Generation['status']): string {
  const labels: Record<Generation['status'], string> = {
    pending: 'В очереди',
    processing: 'Генерация',
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function GenerationPreview({ generation, open, onOpenChange }: GenerationPreviewProps) {
  if (!generation) return null;

  const isVideo = generation.type === 'video';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Генерация</DialogTitle>
          <DialogDescription>
            {generation.type === 'video' ? 'Видео' : generation.type === 'photo' ? 'Фото' : generation.type === 'avatar' ? 'Аватар' : 'Маскот'}
          </DialogDescription>
        </DialogHeader>

        {/* Preview area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
          {generation.status === 'done' && generation.result_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generation.result_url}
                alt={generation.prompt}
                className="h-full w-full object-cover"
              />
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md border border-white/30 transition-transform hover:scale-110 cursor-pointer">
                    <Play className="h-7 w-7 text-white ml-1" />
                  </div>
                </div>
              )}
            </>
          ) : generation.status === 'processing' ? (
            <Skeleton className="h-full w-full rounded-none" />
          ) : (
            <div className="flex h-full items-center justify-center text-white/20">
              {generation.status === 'failed' ? 'Ошибка генерации' : 'Ожидание...'}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3">
          <p className="text-sm text-white/80 leading-relaxed">{generation.prompt}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(generation.status)}>
              {statusLabel(generation.status)}
            </Badge>

            {generation.credits_spent > 0 && (
              <Badge variant="default" className="gap-1">
                <Coins className="h-3 w-3" />
                {generation.credits_spent} кредитов
              </Badge>
            )}

            <Badge variant="default" className="gap-1">
              <Cpu className="h-3 w-3" />
              {generation.provider}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Создано: {formatDate(generation.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Обновлено: {formatDate(generation.updated_at)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
