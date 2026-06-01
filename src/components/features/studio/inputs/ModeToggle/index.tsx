'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

export interface ModeOption {
  value: string;
  label: string;
  tooltip?: string;
}

export interface ModeToggleProps {
  value: string;
  onChange: (value: string) => void;
  options: ModeOption[];
  layoutId?: string;
}

export function ModeToggle({ value, onChange, options, layoutId = 'mode-bg' }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-white/5 rounded-xl p-1 gap-1">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const button = (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 whitespace-nowrap',
              isActive ? 'text-white' : 'text-white/50 hover:text-white/70'
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 rounded-lg bg-white/10"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );

        if (opt.tooltip) {
          return (
            <Tooltip key={opt.value} content={opt.tooltip}>
              {button}
            </Tooltip>
          );
        }

        return button;
      })}
    </div>
  );
}
