'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PaletteOption {
  value: string;
  label: string;
  colors: string[];
}

export interface ColorPaletteSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  presets: PaletteOption[];
  allowCustom?: boolean;
}

function buildConicGradient(colors: string[]): string {
  if (colors.length === 0) return 'transparent';
  const step = 360 / colors.length;
  const stops = colors
    .map((color, i) => `${color} ${i * step}deg ${(i + 1) * step}deg`)
    .join(', ');
  return `conic-gradient(${stops})`;
}

export function ColorPaletteSelect({
  value,
  onChange,
  presets,
  allowCustom = false,
}: ColorPaletteSelectProps) {
  const handleCustom = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* None option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        title="Нет"
        className={cn(
          'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-150',
          value === null
            ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/40 scale-110'
            : 'border-white/20 hover:border-white/40'
        )}
      >
        <span className="text-[9px] text-white/50">∅</span>
      </button>

      {presets.map((preset) => {
        const isActive = value === preset.value;
        return (
          <motion.button
            key={preset.value}
            type="button"
            title={preset.label}
            onClick={() => onChange(preset.value)}
            whileTap={{ scale: 0.9 }}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-all duration-150',
              isActive
                ? 'border-[#7F77DD] ring-2 ring-[#7F77DD]/40 scale-110'
                : 'border-white/10 hover:border-white/30 hover:scale-105'
            )}
            style={{
              background: buildConicGradient(preset.colors),
            }}
          />
        );
      })}

      {/* Custom color picker */}
      {allowCustom && (
        <label
          title="Свой цвет"
          className={cn(
            'relative w-7 h-7 rounded-full border-2 cursor-pointer overflow-hidden transition-all duration-150',
            'border-white/20 hover:border-white/40'
          )}
        >
          <input
            type="color"
            value={typeof value === 'string' && value.startsWith('#') ? value : '#7F77DD'}
            onChange={handleCustom}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
          <div
            className="w-full h-full"
            style={{
              background:
                typeof value === 'string' && value.startsWith('#')
                  ? value
                  : 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)',
            }}
          />
        </label>
      )}
    </div>
  );
}
