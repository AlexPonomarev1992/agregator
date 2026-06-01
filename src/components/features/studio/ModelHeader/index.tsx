'use client';

import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Exchange01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ModelDefinition } from '@/lib/models/types';
import { ModeToggle } from '../inputs/ModeToggle';
import { ModelBadge } from '../ModelBadge';
import { PricingBadge } from '../inputs/PricingBadge';

export interface ModelHeaderProps {
  model: ModelDefinition;
  activeMode: string;
  onChangeMode: (mode: string) => void;
  onChangeModel: () => void;
  currentCredits?: number;
}

export function ModelHeader({
  model,
  activeMode,
  onChangeMode,
  onChangeModel,
  currentCredits,
}: ModelHeaderProps) {
  const modeOptions = model.modes.map((m) => ({
    value: m.id,
    label: m.label,
    tooltip: m.description,
  }));

  return (
    <div className="flex h-20 items-center gap-4 border-b border-white/[0.08] bg-white/[0.03] px-6 py-4 backdrop-blur-sm">
      {/* Provider icon placeholder */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          'bg-gradient-to-br from-[#7F77DD]/20 to-purple-500/10 border border-white/10'
        )}
      >
        <span className="text-sm font-bold text-white/60 uppercase">
          {model.provider.slice(0, 2)}
        </span>
      </div>

      {/* Model name & badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white truncate">{model.name}</span>
          {model.badges.map((badge) => (
            <ModelBadge key={badge} badge={badge} />
          ))}
        </div>
        <p className="text-[11px] text-white/40 truncate capitalize">{model.provider}</p>
      </div>

      {/* Mode tabs (center) — only if multiple modes */}
      {model.modes.length > 1 && (
        <div className="shrink-0">
          <ModeToggle
            value={activeMode}
            onChange={onChangeMode}
            options={modeOptions}
            layoutId={`mode-bg-${model.id}`}
          />
        </div>
      )}

      {/* Right side: pricing + change model button */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <PricingBadge
          credits={currentCredits ?? model.pricing.base}
          animate={false}
        />

        <button
          type="button"
          onClick={onChangeModel}
          className={cn(
            'flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5',
            'text-xs text-white/50 hover:text-white/80 hover:border-white/20 hover:bg-white/10',
            'transition-all duration-150'
          )}
        >
          <HugeiconsIcon icon={Exchange01Icon} size={13} color="currentColor" strokeWidth={1.5} />
          <span className="hidden sm:inline">Сменить</span>
        </button>
      </div>
    </div>
  );
}
