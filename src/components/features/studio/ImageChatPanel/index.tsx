'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Send, Download, RefreshCw, Sparkles, ArrowUpRight, X } from '@/components/ui/icons';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ImageEntry {
  id: string;
  prompt: string;
  imageUrl?: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  generationId?: string;
  errorMessage?: string;
  createdAt: number;
  aspectRatio?: string;
}

interface ImageChatPanelProps {
  entries: ImageEntry[];
  isGenerating: boolean;
  aspectRatio?: string;
  onSend: (prompt: string) => void;
  onEnhance: (prompt: string) => Promise<string>;
  onDownload: (url: string) => void;
  onUseAsInput: (url: string) => void;
  onRegenerate: (entry: ImageEntry) => void;
}

// ─── Blob animation (matches ChatView image generating style) ─────────────────

const BLOBS = [
  {
    size: 260,
    dur: 9,
    bg: 'radial-gradient(circle at 35% 35%, rgba(127,119,221,0.95), transparent 68%)',
    x: ['-18%', '34%', '6%', '-22%', '-18%'],
    y: ['-12%', '22%', '46%', '8%', '-12%'],
    rotate: [0, 70, -45, 35, 0],
    radii: ['42% 58% 63% 37% / 41% 44% 56% 59%', '67% 33% 47% 53% / 37% 62% 38% 63%', '38% 62% 35% 65% / 60% 38% 62% 40%', '55% 45% 58% 42% / 49% 56% 44% 51%', '42% 58% 63% 37% / 41% 44% 56% 59%'],
  },
  {
    size: 220,
    dur: 11.5,
    bg: 'radial-gradient(circle at 60% 40%, rgba(96,165,250,0.9), transparent 68%)',
    x: ['28%', '-24%', '18%', '-6%', '28%'],
    y: ['20%', '-14%', '34%', '48%', '20%'],
    rotate: [0, -55, 40, -30, 0],
    radii: ['63% 37% 42% 58% / 56% 41% 59% 44%', '34% 66% 57% 43% / 47% 63% 37% 53%', '58% 42% 33% 67% / 38% 55% 45% 62%', '45% 55% 62% 38% / 60% 44% 56% 40%', '63% 37% 42% 58% / 56% 41% 59% 44%'],
  },
  {
    size: 200,
    dur: 13.7,
    bg: 'radial-gradient(circle at 45% 60%, rgba(232,121,249,0.8), transparent 70%)',
    x: ['6%', '30%', '-26%', '14%', '6%'],
    y: ['40%', '4%', '24%', '-16%', '40%'],
    rotate: [0, 50, -60, 25, 0],
    radii: ['50% 50% 36% 64% / 64% 36% 64% 36%', '40% 60% 60% 40% / 40% 45% 55% 60%', '66% 34% 53% 47% / 57% 62% 38% 43%', '37% 63% 47% 53% / 45% 38% 62% 55%', '50% 50% 36% 64% / 64% 36% 64% 36%'],
  },
] as const;

function ImageGenAnimation() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {BLOBS.map((b, i) => (
        <motion.div
          key={i}
          className="absolute blur-2xl will-change-transform"
          style={{
            width: b.size,
            height: b.size,
            left: '50%',
            top: '50%',
            marginLeft: -b.size / 2,
            marginTop: -b.size / 2,
            background: b.bg,
            mixBlendMode: 'screen',
          }}
          animate={{
            x: [...b.x],
            y: [...b.y],
            rotate: [...b.rotate],
            borderRadius: [...b.radii],
            scale: [1, 1.25, 0.9, 1.15, 1],
          }}
          transition={{ duration: b.dur, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 95% at 50% 35%, transparent 38%, rgba(10,10,12,0.5) 100%)' }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 4.3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ImageThumb({
  entry,
  isActive,
  onClick,
}: {
  entry: ImageEntry;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border transition-all',
        isActive
          ? 'border-[#7F77DD] shadow-md shadow-[#7F77DD]/20'
          : 'border-white/10 hover:border-white/25'
      )}
    >
      {entry.status === 'succeeded' && entry.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.imageUrl} alt={entry.prompt} className="w-full h-full object-cover" />
      ) : entry.status === 'failed' ? (
        <div className="w-full h-full bg-red-900/20 flex items-center justify-center">
          <X className="h-3 w-3 text-red-400" />
        </div>
      ) : (
        <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 rounded-full border-2 border-white/10 border-t-[#7F77DD]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      )}
      {isActive && (
        <div className="absolute inset-0 ring-1 ring-inset ring-[#7F77DD]/70 rounded-lg" />
      )}
    </motion.button>
  );
}

// ─── Main Image Display ───────────────────────────────────────────────────────

function ImageDisplay({
  entry,
  aspectRatio,
  onDownload,
  onUseAsInput,
  onRegenerate,
}: {
  entry?: ImageEntry;
  aspectRatio?: string;
  onDownload: (url: string) => void;
  onUseAsInput: (url: string) => void;
  onRegenerate: (e: ImageEntry) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  if (!entry) {
    const ratio = aspectRatio ?? '1:1';
    const cssRatio = ratio.replace(':', '/');
    const parts = ratio.split(':').map(Number);
    const isPortrait = parts.length === 2 && parts[1] > parts[0];

    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 select-none">
        {/* Canvas placeholder shaped to the chosen aspect ratio */}
        <motion.div
          key={ratio}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 overflow-hidden bg-white/[0.02]"
          style={{
            aspectRatio: cssRatio,
            maxHeight: '100%',
            maxWidth: isPortrait ? '60%' : '100%',
            width: isPortrait ? 'auto' : '100%',
          }}
        >
          {/* Subtle dot grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Image icon */}
          <svg viewBox="0 0 48 48" fill="none" className="relative w-9 h-9 text-white/12">
            <rect x="6" y="12" width="36" height="26" rx="4" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="17" cy="22" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 30 L15 22 L22 29 L29 22 L42 32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {/* Ratio badge */}
          <span className="relative text-[10px] font-semibold text-white/20 tracking-wide">{ratio}</span>
        </motion.div>
        <p className="text-[11px] text-white/22">Введите промпт и нажмите Создать</p>
      </div>
    );
  }

  // Compute CSS aspect-ratio from e.g. "9:16" → "9/16"
  const cssRatio = entry.aspectRatio?.replace(':', '/') ?? '1/1';

  if (entry.status === 'queued' || entry.status === 'running') {
    return (
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-[#7F77DD]/20 h-full"
        style={{ aspectRatio: cssRatio, maxWidth: '100%', maxHeight: '100%' }}
        animate={{
          boxShadow: [
            '0 0 0px 0px rgba(127,119,221,0.12)',
            '0 0 24px 4px rgba(127,119,221,0.45)',
            '0 0 0px 0px rgba(127,119,221,0.12)',
          ],
          borderColor: ['rgba(127,119,221,0.20)', 'rgba(127,119,221,0.65)', 'rgba(127,119,221,0.20)'],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ImageGenAnimation />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/80">
            <span>{entry.status === 'queued' ? 'В очереди…' : 'Генерирую…'}</span>
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[#7F77DD]"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="w-24 h-px rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-[#a59ef5]"
              animate={{ width: ['0%', '85%'] }}
              transition={{ duration: 28, ease: 'easeOut' }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  if (entry.status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2.5">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="h-4 w-4 text-red-400" />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-xs text-red-400 font-medium">Генерация не удалась</p>
          <p className="text-[11px] text-white/30">{entry.errorMessage ?? 'Попробуйте снова'}</p>
        </div>
        <button
          onClick={() => onRegenerate(entry)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/8 hover:bg-white/12 text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Повторить
        </button>
      </div>
    );
  }

  // succeeded — image fills compact container at natural ratio
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative group h-full flex items-center justify-center"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative rounded-xl overflow-hidden bg-zinc-900 h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.imageUrl!}
          alt={entry.prompt}
          className="block h-full w-auto max-w-full object-contain"
        />

        {/* Hover actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-0 left-0 right-0 px-2.5 py-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2"
            >
              <p className="text-[10px] text-white/45 truncate min-w-0">{entry.prompt}</p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onRegenerate(entry)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Повторить"
                >
                  <RefreshCw className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={() => onUseAsInput(entry.imageUrl!)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[#7F77DD]/20 hover:bg-[#7F77DD]/30 text-[#7F77DD] border border-[#7F77DD]/30 transition-colors"
                >
                  <ArrowUpRight className="h-2.5 w-2.5" />
                  Референс
                </button>
                <a
                  href={entry.imageUrl}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white/10 hover:bg-white/20 text-white transition-colors"
                  onClick={() => onDownload(entry.imageUrl!)}
                >
                  <Download className="h-2.5 w-2.5" />
                  Скачать
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── ImageChatPanel ───────────────────────────────────────────────────────────

export function ImageChatPanel({
  entries,
  isGenerating,
  aspectRatio,
  onSend,
  onEnhance,
  onDownload,
  onUseAsInput,
  onRegenerate,
}: ImageChatPanelProps) {
  const [input, setInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Active entry: user-selected OR latest entry
  const activeEntry = activeEntryId
    ? entries.find((e) => e.id === activeEntryId)
    : entries.at(-1);

  // Auto-select newest entry when it arrives
  useEffect(() => {
    if (entries.length > 0) {
      const last = entries.at(-1)!;
      setActiveEntryId(last.id);
    }
  }, [entries.length]);

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isGenerating) return;
    onSend(text);
    setInput('');
  }, [input, isGenerating, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleEnhance = useCallback(async () => {
    if (!input.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await onEnhance(input.trim());
      if (enhanced) setInput(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  }, [input, isEnhancing, onEnhance]);

  const hasEntries = entries.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Compact image preview ─────────────────────── */}
      <div
        className="flex-shrink-0 flex items-center justify-center px-4 pt-3 pb-2"
        style={{ height: 'clamp(200px, 38vh, 320px)' }}
      >
        <ImageDisplay
          entry={activeEntry}
          aspectRatio={aspectRatio}
          onDownload={onDownload}
          onUseAsInput={onUseAsInput}
          onRegenerate={onRegenerate}
        />
      </div>

      {/* ── Iteration thumbnails strip ─────────────────── */}
      <AnimatePresence initial={false}>
        {hasEntries && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-shrink-0"
          >
            <div className="border-t border-white/5 px-4 py-2">
              <div className="flex items-center gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {entries.map((entry) => (
                  <ImageThumb
                    key={entry.id}
                    entry={entry}
                    isActive={entry.id === (activeEntryId ?? entries.at(-1)?.id)}
                    onClick={() => setActiveEntryId(entry.id)}
                  />
                ))}
                <div ref={historyEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* spacer */}
      <div className="flex-1 min-h-0" />

      {/* ── Chat input bar ─────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-white/5 p-3">
        <div className={cn(
          'flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors',
          'bg-white/5 border-white/10 focus-within:border-[#7F77DD]/40 focus-within:bg-white/[0.07]'
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasEntries
                ? 'Уточнить, изменить стиль, добавить элемент...'
                : 'Описание изображения...'
            }
            disabled={isGenerating}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent text-sm text-white',
              'placeholder:text-white/25 focus:outline-none py-1',
              'disabled:opacity-50',
            )}
            style={{ scrollbarWidth: 'none', maxHeight: '96px' }}
          />

          <div className="flex items-center gap-1.5 flex-shrink-0 pb-0.5">
            {/* Enhance */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleEnhance}
              disabled={!input.trim() || isEnhancing || isGenerating}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                'bg-white/5 border border-white/10 hover:bg-white/10',
                'disabled:opacity-30 disabled:cursor-not-allowed',
                isEnhancing && 'animate-pulse'
              )}
            >
              <Sparkles className="h-3 w-3 text-[#7F77DD]" />
              <span className="text-white/55 hidden sm:inline">{isEnhancing ? 'Улучшаем…' : 'Улучшить'}</span>
            </motion.button>

            {/* Send */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors',
                'bg-[#7F77DD] hover:bg-[#6e66cc] text-white shadow-md shadow-[#7F77DD]/20',
                'disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              {isGenerating ? (
                <motion.span
                  className="h-3 w-3 rounded-full border border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Send className="h-3 w-3" />
              )}
              <span>{hasEntries ? 'Итерация' : 'Создать'}</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
