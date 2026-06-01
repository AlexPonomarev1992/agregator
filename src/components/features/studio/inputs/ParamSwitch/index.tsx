'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ParamSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function ParamSwitch({ value, onChange, label, description }: ParamSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-4 py-0.5 text-left"
    >
      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <span className="block text-sm text-white/70">{label}</span>
        {description && (
          <span className="block text-[11px] text-white/35">{description}</span>
        )}
      </div>

      {/* Switch track */}
      <div
        className={cn(
          'relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200',
          value ? 'bg-[#7F77DD]' : 'bg-white/15'
        )}
      >
        {/* Thumb */}
        <motion.div
          animate={{ x: value ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md"
        />
      </div>
    </button>
  );
}
