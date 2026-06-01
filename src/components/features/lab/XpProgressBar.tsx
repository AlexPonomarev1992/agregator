'use client';

import { motion } from 'framer-motion';
import { Zap } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';

interface XpProgressBarProps {
  totalXp: number;
}

// Simple level calculation: each level requires more XP
function getLevel(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number } {
  const xpPerLevel = 500;
  const level = Math.floor(xp / xpPerLevel) + 1;
  const currentLevelXp = xp % xpPerLevel;
  return { level, currentLevelXp, nextLevelXp: xpPerLevel };
}

export function XpProgressBar({ totalXp }: XpProgressBarProps) {
  const { level, currentLevelXp, nextLevelXp } = getLevel(totalXp);
  const progressPercent = (currentLevelXp / nextLevelXp) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4"
    >
      {/* Level badge */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/40 to-[#6B5FCC] shadow-lg shadow-white/10">
        <span className="text-lg font-bold text-white">{level}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Уровень {level}</span>
          <div className="flex items-center gap-1 text-white">
            <Zap className="h-3.5 w-3.5" />
            <span className="text-sm font-semibold">{totalXp} XP</span>
          </div>
        </div>
        <Progress value={progressPercent} />
        <p className="mt-1 text-xs text-white/40">
          {currentLevelXp} / {nextLevelXp} XP до следующего уровня
        </p>
      </div>
    </motion.div>
  );
}
