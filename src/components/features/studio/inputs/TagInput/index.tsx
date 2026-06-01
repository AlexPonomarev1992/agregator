'use client';

import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { CancelCircleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  presets?: string[];
  maxTags?: number;
  placeholder?: string;
}

export function TagInput({
  value,
  onChange,
  presets = [],
  maxTags = 8,
  placeholder = 'Добавить тег...',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim().toLowerCase();
      if (!trimmed) return;
      if (value.includes(trimmed)) return;
      if (value.length >= maxTags) return;
      onChange([...value, trimmed]);
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(inputValue);
        setInputValue('');
      } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
        removeTag(value[value.length - 1]);
      }
    },
    [inputValue, addTag, removeTag, value]
  );

  const availablePresets = presets.filter((p) => !value.includes(p));

  return (
    <div className="space-y-2">
      {/* Tag container */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          'flex flex-wrap gap-1.5 p-2 rounded-xl bg-white/5 border transition-all duration-150 min-h-[44px] cursor-text',
          isFocused ? 'border-[#7F77DD]/40' : 'border-white/10'
        )}
      >
        <AnimatePresence>
          {value.map((tag) => (
            <motion.span
              key={tag}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="inline-flex items-center gap-1 rounded-lg bg-[#7F77DD]/20 px-2 py-1 text-xs text-[#7F77DD]"
            >
              {tag}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                className="text-[#7F77DD]/60 hover:text-[#7F77DD] transition-colors"
              >
                <HugeiconsIcon icon={CancelCircleIcon} size={12} color="currentColor" strokeWidth={1.5} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {value.length < maxTags && (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); if (inputValue.trim()) { addTag(inputValue); setInputValue(''); } }}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[100px] bg-transparent text-xs text-white placeholder:text-white/30 outline-none"
          />
        )}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30">{value.length}/{maxTags} тегов</span>
      </div>

      {/* Presets */}
      {availablePresets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {availablePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addTag(preset)}
              disabled={value.length >= maxTags}
              className={cn(
                'rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/50',
                'hover:border-[#7F77DD]/40 hover:bg-[#7F77DD]/10 hover:text-[#7F77DD] transition-all',
                'disabled:opacity-30 disabled:cursor-not-allowed'
              )}
            >
              + {preset}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
