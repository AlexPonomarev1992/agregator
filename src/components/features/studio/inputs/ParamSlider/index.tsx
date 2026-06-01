'use client';

import React, { useCallback, useRef } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ShuffleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export interface ParamSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  description?: string;
  showRandom?: boolean;
  formatValue?: (v: number) => string;
}

export function ParamSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  description,
  showRandom = false,
  formatValue,
}: ParamSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const fillPercent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  const handleRandom = useCallback(() => {
    const randomVal = min + Math.random() * (max - min);
    // Round to step
    const stepped = Math.round(randomVal / step) * step;
    const clamped = Math.min(max, Math.max(min, stepped));
    onChange(parseFloat(clamped.toFixed(10)));
  }, [min, max, step, onChange]);

  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <div className="space-y-2">
      {(label || description) && (
        <div className="flex items-start justify-between gap-2">
          <div>
            {label && <span className="block text-sm text-white/60">{label}</span>}
            {description && <span className="block text-[11px] text-white/35">{description}</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {showRandom && (
              <Tooltip content="Случайное значение">
                <button
                  type="button"
                  onClick={handleRandom}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <HugeiconsIcon icon={ShuffleIcon} size={14} color="currentColor" strokeWidth={1.5} />
                </button>
              </Tooltip>
            )}
            <span className="w-12 text-right text-sm font-mono text-white/80">{displayValue}</span>
          </div>
        </div>
      )}

      <div ref={trackRef} className="relative flex items-center h-6">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10 overflow-hidden">
          {/* Fill */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#7F77DD] to-purple-400 transition-none"
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        {/* Native range input (transparent, positioned over) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={cn(
            'relative w-full appearance-none bg-transparent cursor-pointer h-6',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-4',
            '[&::-webkit-slider-thumb]:h-4',
            '[&::-webkit-slider-thumb]:rounded-full',
            '[&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:shadow-md',
            '[&::-webkit-slider-thumb]:ring-2',
            '[&::-webkit-slider-thumb]:ring-[#7F77DD]/40',
            '[&::-webkit-slider-thumb]:cursor-grab',
            '[&::-webkit-slider-thumb]:active:cursor-grabbing',
            '[&::-moz-range-thumb]:w-4',
            '[&::-moz-range-thumb]:h-4',
            '[&::-moz-range-thumb]:rounded-full',
            '[&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:ring-2',
            '[&::-moz-range-thumb]:ring-[#7F77DD]/40',
            '[&::-moz-range-track]:bg-transparent'
          )}
        />
      </div>

      {/* Min/Max hints */}
      <div className="flex justify-between text-[10px] text-white/25">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
