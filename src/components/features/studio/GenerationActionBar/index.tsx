'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Refresh01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { PricingBadge } from '../inputs/PricingBadge';

export interface GenerationActionBarProps {
  credits: number;
  userCredits: number;
  isLoading: boolean;
  onGenerate: () => void;
  onReset?: () => void;
  disabled?: boolean;
}

export function GenerationActionBar({
  credits,
  userCredits,
  isLoading,
  onGenerate,
  onReset,
  disabled = false,
}: GenerationActionBarProps) {
  const hasEnoughCredits = userCredits >= credits;
  const isDisabled = disabled || isLoading;

  return (
    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
      {/* Generate button */}
      <motion.button
        type="button"
        onClick={onGenerate}
        disabled={isDisabled}
        whileTap={!isDisabled ? { scale: 0.97 } : undefined}
        className={cn(
          'flex flex-1 h-12 items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200',
          hasEnoughCredits
            ? 'bg-[#7F77DD] hover:bg-[#7F77DD]/80 text-white'
            : 'border border-[#7F77DD]/40 bg-transparent text-[#7F77DD] animate-pulse',
          isDisabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <>
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              color="currentColor"
              strokeWidth={1.5}
              className="animate-spin"
            />
            <span>Генерация...</span>
          </>
        ) : hasEnoughCredits ? (
          <>
            <HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" strokeWidth={1.5} />
            <span>Сгенерировать</span>
            <PricingBadge credits={credits} animate />
          </>
        ) : (
          <>
            <HugeiconsIcon icon={SparklesIcon} size={16} color="currentColor" strokeWidth={1.5} />
            <span>Купить кредиты</span>
            <PricingBadge credits={credits} animate />
          </>
        )}
      </motion.button>

      {/* Reset button */}
      {onReset && (
        <motion.button
          type="button"
          onClick={onReset}
          disabled={isLoading}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'flex h-12 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5',
            'text-white/50 hover:text-white/80 hover:bg-white/10 transition-all',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
          title="Сбросить настройки"
        >
          <HugeiconsIcon icon={Refresh01Icon} size={16} color="currentColor" strokeWidth={1.5} />
        </motion.button>
      )}
    </div>
  );
}
