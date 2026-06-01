'use client';

import { motion } from 'framer-motion';
import { Trophy, Zap, Award } from '@/components/ui/icons';
import { Progress } from '@/components/ui/progress';

interface ApiUserRating {
  userId: string;
  totalXp: number;
  rank: number | null;
  badgesCount: number;
}

interface UserRankCardProps {
  myRating: ApiUserRating | null;
}

export function UserRankCard({ myRating }: UserRankCardProps) {
  const rank = myRating?.rank ?? 0;
  const totalXp = myRating?.totalXp ?? 0;
  const badgesCount = myRating?.badgesCount ?? 0;

  // Next rank requires some more XP
  const xpForNextRank = 3500;
  const progressPercent = Math.min(100, (totalXp / xpForNextRank) * 100);

  if (!myRating) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
      >
        <p className="text-sm text-white/40 text-center">
          Начните проходить эксперименты, чтобы появиться в рейтинге!
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
    >
      <div className="flex items-center gap-6">
        {/* Rank number */}
        <div className="text-center">
          <span className="text-4xl font-bold bg-gradient-to-b from-white/40 to-[#9B8FEE] bg-clip-text text-transparent">
            {rank ? `#${rank}` : '—'}
          </span>
          <p className="mt-1 text-xs text-white/40">Ваш ранг</p>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-semibold">{totalXp} XP</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Award className="h-4 w-4" />
              <span className="text-sm">{badgesCount} бейджей</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-white/40">
                {rank && rank > 1 ? `Прогресс до #${rank - 1}` : 'Прогресс'}
              </span>
              <span className="text-xs text-white/40">{totalXp} / {xpForNextRank} XP</span>
            </div>
            <Progress value={progressPercent} />
          </div>
        </div>

        <Trophy className="h-8 w-8 text-white/30 hidden md:block" />
      </div>
    </motion.div>
  );
}
