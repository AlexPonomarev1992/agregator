'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AspectRatioPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

// Visual box — scaled so the longest side = MAX_DIM
const MAX_DIM = 24;
const MIN_DIM = 3; // floor for extreme slivers

function getRatioBox(ratio: string): { w: number; h: number } {
  if (ratio === 'auto') return { w: 20, h: 20 };
  const parts = ratio.split(':').map(Number);
  if (parts.length === 2 && parts[0] > 0 && parts[1] > 0) {
    const scale = MAX_DIM / Math.max(parts[0], parts[1]);
    return {
      w: Math.max(MIN_DIM, Math.round(parts[0] * scale)),
      h: Math.max(MIN_DIM, Math.round(parts[1] * scale)),
    };
  }
  return { w: 20, h: 20 };
}

// Friendly short label — only for common ratios, omit for extremes
const SHORT_LABEL: Record<string, string> = {
  '1:1': 'Square',
  '16:9': 'Wide',
  '9:16': 'Tall',
  '4:3': '4:3',
  '3:4': '3:4',
  '3:2': '3:2',
  '2:3': '2:3',
  '4:5': '4:5',
  '5:4': '5:4',
  '21:9': 'Cinema',
  '16:10': '16:10',
  '10:16': '10:16',
  'auto': 'Auto',
};

export function AspectRatioPicker({ value, onChange, options }: AspectRatioPickerProps) {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
      {options.map((ratio) => {
        const isActive = value === ratio;
        const box = getRatioBox(ratio);
        // "small" = one dimension ≤ 5px → icon-only, no label
        const isCompact = Math.min(box.w, box.h) <= 5;

        return (
          <motion.button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            whileTap={{ scale: 0.93 }}
            title={ratio}
            className={cn(
              'group flex flex-col items-center justify-center rounded-lg border transition-all duration-150 cursor-pointer',
              isCompact ? 'gap-1 py-1.5 px-1' : 'gap-1.5 py-2 px-1',
              isActive
                ? 'border-[#7F77DD]/50 bg-[#7F77DD]/10 shadow-sm shadow-[#7F77DD]/10'
                : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6'
            )}
          >
            {/* Fixed 24×24 container — keeps all cards the same height */}
            <div className="flex items-center justify-center" style={{ width: 24, height: 24 }}>
              {ratio === 'auto' ? (
                <span className={cn(
                  'text-[11px] font-bold transition-colors',
                  isActive ? 'text-[#7F77DD]' : 'text-white/30 group-hover:text-white/55'
                )}>≈</span>
              ) : (
                <div
                  className={cn(
                    'rounded-xs transition-colors duration-150',
                    isActive
                      ? 'bg-[#7F77DD]/50 ring-1 ring-[#7F77DD]/60'
                      : 'bg-white/20 group-hover:bg-white/30'
                  )}
                  style={{ width: box.w, height: box.h }}
                />
              )}
            </div>

            {/* Label — always ratio text, friendly name only when space allows */}
            {!isCompact && (
              <p className={cn(
                'text-[9px] font-semibold leading-none transition-colors',
                isActive ? 'text-[#7F77DD]' : 'text-white/40 group-hover:text-white/65'
              )}>
                {SHORT_LABEL[ratio] ?? ratio}
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
