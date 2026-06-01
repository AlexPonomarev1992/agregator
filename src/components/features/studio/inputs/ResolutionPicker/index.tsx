'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ResolutionOption {
  value: string;
  label: string;
  badge?: 'HD' | '2K' | '4K';
}

export interface ResolutionPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: ResolutionOption[];
}

const BADGE_STYLES: Record<'HD' | '2K' | '4K', string> = {
  HD: 'bg-blue-400/20 text-blue-400 border-blue-400/30',
  '2K': 'bg-purple-400/20 text-purple-400 border-purple-400/30',
  '4K': 'bg-amber-400/20 text-amber-400 border-amber-400/30',
};

export function ResolutionPicker({ value, onChange, options }: ResolutionPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            whileTap={{ scale: 0.96 }}
            className={cn(
              'relative flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[72px] transition-all duration-150',
              isActive
                ? 'border-[#7F77DD]/60 bg-[#7F77DD]/15 text-[#7F77DD]'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10'
            )}
          >
            <span className="text-sm font-medium leading-none">{opt.label}</span>

            {opt.badge && (
              <span
                className={cn(
                  'mt-1.5 rounded-md border px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none',
                  BADGE_STYLES[opt.badge]
                )}
              >
                {opt.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
