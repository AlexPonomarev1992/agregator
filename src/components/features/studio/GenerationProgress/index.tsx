'use client';

import { motion } from 'framer-motion';
import { X } from '@/components/ui/icons';

interface GenerationProgressProps {
  status: 'queued' | 'running';
  positionInQueue?: number;
  etaSeconds?: number;
  onCancel?: () => void;
}

export function GenerationProgress({
  status,
  positionInQueue,
  etaSeconds,
  onCancel,
}: GenerationProgressProps) {
  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-zinc-900/80 border border-white/10">
      {/* Shimmer animation */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          title="Отменить"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      )}

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
        {/* Spinning ring */}
        <div className="relative h-12 w-12">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/10 border-t-[#7F77DD]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-white">
            {status === 'queued' ? 'В очереди...' : 'Генерирую...'}
          </p>

          {status === 'queued' && typeof positionInQueue === 'number' && (
            <p className="text-xs text-white/50">
              Позиция в очереди: {positionInQueue}
            </p>
          )}

          {typeof etaSeconds === 'number' && (
            <p className="text-xs text-white/40">
              ~{etaSeconds < 60 ? `${etaSeconds} сек` : `${Math.round(etaSeconds / 60)} мин`}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
        <motion.div
          className="h-full bg-[#7F77DD]"
          animate={status === 'running' ? {
            width: ['0%', '85%'],
          } : { width: '0%' }}
          transition={status === 'running' ? {
            duration: 30,
            ease: 'easeOut',
          } : {}}
        />
      </div>
    </div>
  );
}
