'use client';

import { FileText } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

interface ContextIndicatorProps {
  tokensUsed: number;
  maxTokens: number;
  fileCount: number;
}

export function ContextIndicator({ tokensUsed, maxTokens, fileCount }: ContextIndicatorProps) {
  const percentage = maxTokens > 0 ? (tokensUsed / maxTokens) * 100 : 0;

  const colorClass =
    percentage < 50
      ? 'bg-emerald-500'
      : percentage < 80
        ? 'bg-amber-500'
        : 'bg-red-500';

  const textColorClass =
    percentage < 50
      ? 'text-emerald-400'
      : percentage < 80
        ? 'text-amber-400'
        : 'text-red-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
          <div
            className={cn('h-full rounded-full transition-all', colorClass)}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
        <span className={cn('text-[10px] font-mono', textColorClass)}>
          {tokensUsed.toLocaleString()} / {maxTokens.toLocaleString()}
        </span>
      </div>
      {fileCount > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-white/40">
          <FileText className="h-3 w-3" />
          <span>{fileCount} файл{fileCount > 1 ? (fileCount < 5 ? 'а' : 'ов') : ''}</span>
        </div>
      )}
    </div>
  );
}
