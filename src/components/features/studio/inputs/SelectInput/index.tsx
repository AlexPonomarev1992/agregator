'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDownBigIcon, ValidationIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { SelectOption } from '@/lib/models/types';

export interface SelectInputProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectInput({ value, onChange, options, placeholder = 'Выбрать...' }: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-xl border bg-white/5 px-3 py-2.5 text-sm transition-all duration-150',
          isOpen ? 'border-[#7F77DD]/40 text-white' : 'border-white/10 text-white/70 hover:border-white/20 hover:text-white'
        )}
      >
        <span className="flex-1 text-left truncate">
          {selected ? (
            <span className="flex items-center gap-2">
              <span>{selected.label}</span>
              {selected.badge && (
                <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/50">
                  {selected.badge}
                </span>
              )}
            </span>
          ) : (
            <span className="text-white/40">{placeholder}</span>
          )}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-white/30"
        >
          <HugeiconsIcon icon={ArrowDownBigIcon} size={14} color="currentColor" strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/95 backdrop-blur-md shadow-xl"
          >
            {options.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setIsOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                    isSelected ? 'bg-[#7F77DD]/15' : 'hover:bg-white/5'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-sm', isSelected ? 'text-[#7F77DD]' : 'text-white/80')}>
                        {opt.label}
                      </span>
                      {opt.badge && (
                        <span className="rounded bg-white/10 px-1 py-0.5 text-[10px] text-white/50">
                          {opt.badge}
                        </span>
                      )}
                      {opt.costModifier && opt.costModifier !== 1 && (
                        <span className="text-[10px] text-amber-400/70">
                          {opt.costModifier > 1 ? `+${Math.round((opt.costModifier - 1) * 100)}%` : `-${Math.round((1 - opt.costModifier) * 100)}%`}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-[11px] text-white/35 truncate">{opt.description}</p>
                    )}
                  </div>

                  {isSelected && (
                    <HugeiconsIcon icon={ValidationIcon} size={14} color="#7F77DD" strokeWidth={1.5} />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
