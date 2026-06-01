'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import { Coins02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface PricingBadgeProps {
  credits: number;
  usd?: number;
  animate?: boolean;
}

function getCreditColorClass(credits: number): string {
  if (credits <= 10) return 'bg-green-400/15 text-green-400 border-green-400/20';
  if (credits <= 50) return 'bg-amber-400/15 text-amber-400 border-amber-400/20';
  return 'bg-red-400/15 text-red-400 border-red-400/20';
}

export function PricingBadge({ credits, usd, animate = false }: PricingBadgeProps) {
  const colorClass = getCreditColorClass(credits);

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        colorClass
      )}
    >
      <HugeiconsIcon icon={Coins02Icon} size={12} color="currentColor" strokeWidth={1.5} />
      {credits} кр.
      {usd !== undefined && (
        <span className="opacity-60 ml-0.5">≈${usd.toFixed(2)}</span>
      )}
    </span>
  );

  if (!animate) return content;

  return (
    <motion.span
      key={credits}
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="inline-flex"
    >
      {content}
    </motion.span>
  );
}
