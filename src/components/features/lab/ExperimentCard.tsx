'use client';

import { motion } from 'framer-motion';
import { Lock, Check, Zap } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import type { Experiment } from '@/types';

interface ExperimentCardProps {
  experiment: Experiment;
  status: 'not_started' | 'started' | 'completed';
  isLocked: boolean;
  index: number;
  onClick: () => void;
}

export function ExperimentCard({ experiment, status, isLocked, index, onClick }: ExperimentCardProps) {
  const statusConfig = {
    not_started: { label: 'Не начат', variant: 'default' as const },
    started: { label: 'В процессе', variant: 'purple' as const },
    completed: { label: 'Завершён', variant: 'success' as const },
  };

  const { label, variant } = statusConfig[status];

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative w-full text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 transition-shadow hover:shadow-lg hover:shadow-white/10"
    >
      {/* Gradient accent on top */}
      <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-gradient-to-r from-white/40 to-[#9B8FEE]" />

      {isLocked && (
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
            <Lock className="h-3 w-3 text-white/50" />
            <span className="text-[10px] text-white/50">RoyalPass</span>
          </div>
        </div>
      )}

      <h3 className="text-base font-semibold text-white pr-20">
        {experiment.title}
      </h3>

      <p className="mt-2 text-sm text-white/50 line-clamp-2">
        {experiment.description}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-white">
          <Zap className="h-3.5 w-3.5" />
          <span className="text-xs font-semibold">+{experiment.xp_reward} XP</span>
        </div>

        <Badge variant={variant} className="gap-1">
          {status === 'completed' && <Check className="h-3 w-3" />}
          {label}
        </Badge>
      </div>
    </motion.button>
  );
}
