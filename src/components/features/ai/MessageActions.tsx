'use client';

import { Copy, Pencil, RefreshCw, Trash2, Check } from '@/components/ui/icons';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { ChatMessageRole } from '@/types';

interface MessageActionsProps {
  role: ChatMessageRole;
  content: string;
  onCopy: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete: () => void;
}

export function MessageActions({
  role,
  content,
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-zinc-900/90 backdrop-blur-md p-0.5 shadow-lg">
      <button
        onClick={handleCopy}
        className={cn(
          'rounded-md p-1.5 transition-colors',
          copied ? 'text-emerald-400' : 'text-white/40 hover:bg-white/10 hover:text-white/70'
        )}
        title="Копировать"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>

      {role === 'user' && onEdit && (
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          title="Редактировать"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {role === 'assistant' && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
          title="Перегенерировать"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      )}

      <button
        onClick={onDelete}
        className="rounded-md p-1.5 text-white/40 transition-colors hover:bg-red-500/20 hover:text-red-400"
        title="Удалить"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
