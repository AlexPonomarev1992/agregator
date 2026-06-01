'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface DurationOption {
  value: number;
  credits: number;
}

export interface DurationPickerProps {
  value: number;
  onChange: (value: number) => void;
  options: DurationOption[];
}

export function DurationPicker({ value, onChange, options }: DurationPickerProps) {
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
              'flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[60px] transition-all duration-150',
              isActive
                ? 'border-[#7F77DD]/60 bg-[#7F77DD]/15 text-[#7F77DD]'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:bg-white/10'
            )}
          >
            <span className="text-sm font-medium leading-none">{opt.value}с</span>
            <span className="mt-1 text-[10px] leading-none text-white/40">
              ~{opt.credits} кр.
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
