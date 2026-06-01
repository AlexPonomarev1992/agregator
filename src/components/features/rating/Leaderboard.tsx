'use client';

import { motion } from 'framer-motion';
import { Crown, Medal, Zap, Award } from '@/components/ui/icons';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/lib/stores/user-store';

interface ApiLeaderboardEntry {
  userId: string;
  totalXp: number;
  rank: number | null;
  badgesCount: number;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface LeaderboardProps {
  entries: ApiLeaderboardEntry[];
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
}

export function Leaderboard({ entries }: LeaderboardProps) {
  const currentUserId = useUserStore((s) => s.user?.id);

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Таблица лидеров</h2>
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12">
          <p className="text-sm text-white/40">Таблица лидеров пока пуста</p>
        </div>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  // Reorder top3 for podium: #2, #1, #3
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumRanks = top3.length >= 3 ? [2, 1, 3] : top3.map((_, i) => i + 1);

  const medalColors: Record<number, string> = {
    1: 'text-amber-400',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Таблица лидеров</h2>

      {/* Podium - Top 3 */}
      <div className="flex items-end justify-center gap-4 pb-4">
        {podiumOrder.map((entry, index) => {
          const rank = podiumRanks[index];
          const isFirst = rank === 1;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              className={`flex flex-col items-center gap-2 ${isFirst ? 'order-2' : rank === 2 ? 'order-1' : 'order-3'}`}
            >
              <div className="relative">
                {isFirst && (
                  <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-5 w-5 text-amber-400" />
                )}
                <Avatar
                  className={`${isFirst ? 'h-16 w-16' : 'h-12 w-12'} border-2 ${
                    rank === 1 ? 'border-amber-400' : rank === 2 ? 'border-gray-300' : 'border-amber-600'
                  }`}
                >
                  <AvatarImage src={entry.user.avatarUrl ?? undefined} alt={entry.user.name ?? ''} />
                  <AvatarFallback>{getInitials(entry.user.name)}</AvatarFallback>
                </Avatar>
              </div>

              <div className="text-center">
                <p className={`font-medium text-white ${isFirst ? 'text-sm' : 'text-xs'}`}>
                  {entry.user.name ?? 'Пользователь'}
                </p>
                <div className="flex items-center gap-1 justify-center">
                  <Medal className={`h-3 w-3 ${medalColors[rank]}`} />
                  <span className="text-xs text-white/50">{entry.totalXp} XP</span>
                </div>
              </div>

              {/* Podium base */}
              <div
                className={`w-20 rounded-t-lg ${
                  rank === 1
                    ? 'h-16 bg-amber-400/10 border border-amber-400/20'
                    : rank === 2
                      ? 'h-12 bg-gray-300/10 border border-gray-300/20'
                      : 'h-8 bg-amber-600/10 border border-amber-600/20'
                }`}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Rest of the list */}
      <div className="space-y-1">
        {rest.map((entry, index) => {
          const globalRank = index + 4;
          const isCurrentUser = entry.userId === currentUserId;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                isCurrentUser
                  ? 'bg-white/10 border border-white/20'
                  : 'bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <span className="w-8 text-center text-sm font-semibold text-white/50">
                {globalRank}
              </span>
              <Avatar className="h-8 w-8">
                <AvatarImage src={entry.user.avatarUrl ?? undefined} alt={entry.user.name ?? ''} />
                <AvatarFallback>{getInitials(entry.user.name)}</AvatarFallback>
              </Avatar>
              <span className="flex-1 text-sm text-white truncate">
                {entry.user.name ?? 'Пользователь'}
                {isCurrentUser && <span className="ml-2 text-xs text-white">(вы)</span>}
              </span>
              <div className="flex items-center gap-1 text-white/50">
                <Zap className="h-3 w-3" />
                <span className="text-xs">{entry.totalXp} XP</span>
              </div>
              <div className="flex items-center gap-1 text-white/40">
                <Award className="h-3 w-3" />
                <span className="text-xs">{entry.badgesCount}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
