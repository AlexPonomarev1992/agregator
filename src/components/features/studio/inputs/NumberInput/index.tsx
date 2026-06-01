'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, MinusSignIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: NumberInputProps) {
  const decrement = useCallback(() => {
    const next = value - step;
    if (min !== undefined && next < min) return;
    onChange(next);
  }, [value, step, min, onChange]);

  const increment = useCallback(() => {
    const next = value + step;
    if (max !== undefined && next > max) return;
    onChange(next);
  }, [value, step, max, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (isNaN(parsed)) return;
      const clamped =
        min !== undefined ? Math.max(min, max !== undefined ? Math.min(max, parsed) : parsed) : parsed;
      onChange(clamped);
    },
    [min, max, onChange]
  );

  const canDecrement = min === undefined || value - step >= min;
  const canIncrement = max === undefined || value + step <= max;

  return (
    <div className="space-y-1.5">
      {label && <span className="block text-sm text-white/60">{label}</span>}
      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <motion.button
          type="button"
          onClick={decrement}
          disabled={!canDecrement}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex h-10 w-10 items-center justify-center border-r border-white/10 transition-colors',
            canDecrement ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'
          )}
        >
          <HugeiconsIcon icon={MinusSignIcon} size={14} color="currentColor" strokeWidth={1.5} />
        </motion.button>

        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={cn(
            'flex-1 h-10 bg-transparent text-center text-sm text-white font-mono',
            'focus:outline-none [appearance:textfield]',
            '[&::-webkit-inner-spin-button]:appearance-none',
            '[&::-webkit-outer-spin-button]:appearance-none'
          )}
        />

        <motion.button
          type="button"
          onClick={increment}
          disabled={!canIncrement}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'flex h-10 w-10 items-center justify-center border-l border-white/10 transition-colors',
            canIncrement ? 'text-white/60 hover:text-white hover:bg-white/5' : 'text-white/20 cursor-not-allowed'
          )}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={14} color="currentColor" strokeWidth={1.5} />
        </motion.button>
      </div>
    </div>
  );
}
