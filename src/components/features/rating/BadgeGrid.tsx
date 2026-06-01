'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Zap,
  Trophy,
  Star,
  Rocket,
  Crown,
  Target,
  Award,
  Medal,
  Diamond,
} from '@/components/ui/icons';
import type { LucideIcon } from '@/components/ui/icons';

const iconMap: Record<string, LucideIcon> = {
  Flame,
  Zap,
  Trophy,
  Star,
  Rocket,
  Crown,
  Target,
  Award,
  Medal,
  Diamond,
};

interface ApiBadgeEntry {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  badge: {
    id: string;
    name: string;
    description: string | null;
    icon: string;
    condition: Record<string, unknown> | null;
  };
}

interface BadgeGridProps {
  userBadges: ApiBadgeEntry[];
}

export function BadgeGrid({ userBadges }: BadgeGridProps) {
  if (userBadges.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Бейджи</h2>
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12">
          <p className="text-sm text-white/40">Пока нет заработанных бейджей</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Бейджи</h2>

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        {userBadges.map((ub, index) => {
          const badge = ub.badge;
          const IconComponent = iconMap[badge.icon] ?? Star;

          return (
            <motion.div
              key={ub.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              className="relative flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/5 p-4 text-center transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <IconComponent className="h-5 w-5 text-white" />
              </div>

              <span className="text-xs font-medium text-white">
                {badge.name}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
