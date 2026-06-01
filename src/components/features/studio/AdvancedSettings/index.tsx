'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings02Icon, ArrowDownBigIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface AdvancedSettingsProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label?: string;
}

export function AdvancedSettings({
  children,
  defaultOpen = false,
  label = 'Дополнительные настройки',
}: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-white/5 pt-1">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 py-2 text-left text-sm text-white/50 hover:text-white/70 transition-colors"
      >
        <HugeiconsIcon icon={Settings02Icon} size={14} color="currentColor" strokeWidth={1.5} />
        <span className="flex-1">{label}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <HugeiconsIcon icon={ArrowDownBigIcon} size={14} color="currentColor" strokeWidth={1.5} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className={cn(
                'grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 pb-1'
              )}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
