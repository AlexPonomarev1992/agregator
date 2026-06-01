'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface AspectRatioPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

// Map ratio string to visual width/height classes
const RATIO_DIMENSIONS: Record<string, { w: string; h: string }> = {
  '16:9': { w: 'w-10', h: 'h-[22px]' },
  '9:16': { w: 'w-[22px]', h: 'h-10' },
  '1:1': { w: 'w-8', h: 'h-8' },
  '4:3': { w: 'w-9', h: 'h-[28px]' },
  '3:4': { w: 'w-[28px]', h: 'h-9' },
  '2:3': { w: 'w-[24px]', h: 'h-9' },
  '3:2': { w: 'w-9', h: 'h-[24px]' },
  '21:9': { w: 'w-12', h: 'h-[20px]' },
  '10:16': { w: 'w-[25px]', h: 'h-10' },
  '16:10': { w: 'w-10', h: 'h-[25px]' },
};

function getDimensions(ratio: string): { w: string; h: string } {
  if (RATIO_DIMENSIONS[ratio]) return RATIO_DIMENSIONS[ratio];
  // Fallback: compute dynamically
  const parts = ratio.split(':');
  if (parts.length === 2) {
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    if (!isNaN(w) && !isNaN(h) && h > 0) {
      const maxDim = 40;
      const scale = Math.min(maxDim / w, maxDim / h);
      const pw = Math.round(w * scale);
      const ph = Math.round(h * scale);
      return { w: `w-[${pw}px]`, h: `h-[${ph}px]` };
    }
  }
  return { w: 'w-8', h: 'h-8' };
}

export function AspectRatioPicker({ value, onChange, options }: AspectRatioPickerProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((ratio) => {
        const dims = getDimensions(ratio);
        const isActive = value === ratio;
        return (
          <button
            key={ratio}
            type="button"
            onClick={() => onChange(ratio)}
            className="flex flex-col items-center gap-1.5 p-1"
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={cn(
                dims.w,
                dims.h,
                'rounded-sm border transition-all duration-150',
                isActive
                  ? 'border-2 border-[#7F77DD] bg-[#7F77DD]/20'
                  : 'border border-white/20 bg-white/5 hover:border-white/40'
              )}
            />
            <span
              className={cn(
                'text-[10px] leading-none transition-colors',
                isActive ? 'text-[#7F77DD]' : 'text-white/40'
              )}
            >
              {ratio}
            </span>
          </button>
        );
      })}
    </div>
  );
}
