'use client';

import { Coins } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import type { GenerationType } from '@/types';

interface CreditCostBadgeProps {
  type: GenerationType;
}

const CREDIT_COSTS: Record<GenerationType, number> = {
  video: 10,
  photo: 5,
  avatar: 8,
  mascot: 7,
};

export function getCreditCost(type: GenerationType): number {
  return CREDIT_COSTS[type];
}

export function CreditCostBadge({ type }: CreditCostBadgeProps) {
  const cost = CREDIT_COSTS[type];

  return (
    <Badge variant="purple" className="gap-1.5 px-3 py-1">
      <Coins className="h-3.5 w-3.5" />
      <span>{cost} кредитов</span>
    </Badge>
  );
}
