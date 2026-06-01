'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CloudUploadIcon,
  Clock01Icon,
  MagicWand01Icon,
  CancelCircleIcon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  onEnhance?: () => void;
  isEnhancing?: boolean;
  onFileDrop?: (file: File) => void;
  historyItems?: string[];
  onHistorySelect?: (prompt: string) => void;
  disabled?: boolean;
}

type InputState = 'idle' | 'focus' | 'enhancing' | 'error';

export function PromptInput({
  value,
  onChange,
  maxLength,
  placeholder = 'Опишите что хотите создать...',
  onEnhance,
  isEnhancing = false,
  onFileDrop,
  historyItems = [],
  onHistorySelect,
  disabled = false,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [state, setState] = useState<InputState>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  }, [value]);

  // Close history popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setHistoryOpen(false);
      }
    }
    if (historyOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [historyOpen]);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (onFileDrop) setIsDragOver(true);
    },
    [onFileDrop]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!onFileDrop) return;
      const file = e.dataTransfer.files[0];
      if (file) onFileDrop(file);
    },
    [onFileDrop]
  );

  const handleFocus = () => setState('focus');
  const handleBlur = () => setState('idle');

  const currentState: InputState = isEnhancing ? 'enhancing' : state;

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-white/5 backdrop-blur-md transition-all duration-200',
        currentState === 'focus' && 'ring-2 ring-[#7F77DD]/40 border-[#7F77DD]/40',
        currentState === 'idle' && 'border-white/10',
        currentState === 'enhancing' && 'border-[#7F77DD]/40',
        currentState === 'error' && 'border-red-500/40',
        isDragOver && 'ring-2 ring-[#7F77DD]/60 border-[#7F77DD]/60 bg-[#7F77DD]/5'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Shimmer overlay when enhancing */}
      <AnimatePresence>
        {currentState === 'enhancing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#7F77DD]/10 to-transparent animate-[shimmer_1.5s_infinite]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag-over overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 rounded-2xl flex items-center justify-center bg-[#7F77DD]/5 z-10"
          >
            <div className="flex flex-col items-center gap-2 text-[#7F77DD]">
              <HugeiconsIcon icon={CloudUploadIcon} size={28} color="currentColor" strokeWidth={1.5} />
              <span className="text-sm font-medium">Перетащите файл</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled || isEnhancing}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={3}
        className={cn(
          'w-full resize-none bg-transparent px-4 pt-4 pb-2 text-sm text-white placeholder:text-white/30',
          'focus:outline-none min-h-[80px] max-h-[200px] overflow-y-auto',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      />

      {/* Bottom bar */}
      <div className="flex items-center gap-2 px-4 pb-3">
        {/* Drag hint */}
        {onFileDrop && (
          <Tooltip content="Перетащите изображение">
            <button
              type="button"
              className="text-white/30 hover:text-white/60 transition-colors"
              tabIndex={-1}
            >
              <HugeiconsIcon icon={CloudUploadIcon} size={15} color="currentColor" strokeWidth={1.5} />
            </button>
          </Tooltip>
        )}

        {/* History */}
        {historyItems.length > 0 && (
          <div className="relative" ref={historyRef}>
            <Tooltip content="История промптов">
              <button
                type="button"
                onClick={() => setHistoryOpen((v) => !v)}
                className={cn(
                  'text-white/30 hover:text-white/60 transition-colors',
                  historyOpen && 'text-[#7F77DD]'
                )}
              >
                <HugeiconsIcon icon={Clock01Icon} size={15} color="currentColor" strokeWidth={1.5} />
              </button>
            </Tooltip>

            <AnimatePresence>
              {historyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 z-50 w-72 rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <span className="text-xs text-white/50 font-medium">История промптов</span>
                    <button
                      type="button"
                      onClick={() => setHistoryOpen(false)}
                      className="text-white/30 hover:text-white/60"
                    >
                      <HugeiconsIcon icon={CancelCircleIcon} size={14} color="currentColor" strokeWidth={1.5} />
                    </button>
                  </div>
                  <ul className="py-1 max-h-48 overflow-y-auto">
                    {historyItems.map((item, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => {
                            onHistorySelect?.(item);
                            setHistoryOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors truncate"
                        >
                          {item}
                        </button>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Character counter */}
        {maxLength && (
          <span
            className={cn(
              'text-[11px] tabular-nums transition-colors',
              value.length > maxLength * 0.9 ? 'text-amber-400' : 'text-white/30'
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}

        {/* Enhance button */}
        {onEnhance && (
          <motion.button
            type="button"
            onClick={onEnhance}
            disabled={disabled || isEnhancing || !value.trim()}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              'bg-[#7F77DD]/20 text-[#7F77DD] hover:bg-[#7F77DD]/30 border border-[#7F77DD]/30',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <HugeiconsIcon
              icon={MagicWand01Icon}
              size={13}
              color="currentColor"
              strokeWidth={1.5}
              className={isEnhancing ? 'animate-spin' : ''}
            />
            {isEnhancing ? 'Улучшение...' : 'Улучшить'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
