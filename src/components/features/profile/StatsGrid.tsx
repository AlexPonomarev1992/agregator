'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, FlaskConical, Calendar, Trophy } from '@/components/ui/icons';
import { useUserStore } from '@/lib/stores/user-store';
import type { LucideIcon } from '@/components/ui/icons';

interface StatItem {
  icon: LucideIcon;
  value: number | string;
  label: string;
  color: string;
}

interface ProfileStats {
  generationCount: number;
  experimentCount: number;
  rank: number | null;
}

export function StatsGrid() {
  const user = useUserStore((s) => s.user);
  const [stats, setStats] = useState<ProfileStats>({ generationCount: 0, experimentCount: 0, rank: null });

  useEffect(() => {
    async function load() {
      try {
        const [genRes, ratingRes, expRes] = await Promise.all([
          fetch('/api/generate/history?limit=1', { credentials: 'include' }),
          fetch('/api/rating/me', { credentials: 'include' }),
          fetch('/api/experiments', { credentials: 'include' }),
        ]);

        let generationCount = 0;
        if (genRes.ok) {
          const json = await genRes.json();
          generationCount = json.meta?.total ?? json.data?.length ?? 0;
        }

        let rank: number | null = null;
        if (ratingRes.ok) {
          const json = await ratingRes.json();
          rank = json.data?.rank ?? null;
        }

        let experimentCount = 0;
        if (expRes.ok) {
          const json = await expRes.json();
          const experiments = json.data ?? [];
          experimentCount = experiments.filter(
            (e: { userProgress?: { status: string } | null }) => e.userProgress?.status === 'completed'
          ).length;
        }

        setStats({ generationCount, experimentCount, rank });
      } catch {
        // Silently fail
      }
    }

    load();
  }, []);

  const daysOnPlatform = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const items: StatItem[] = [
    { icon: Video, value: stats.generationCount, label: 'Генераций', color: 'text-blue-400 bg-blue-400/20' },
    { icon: FlaskConical, value: stats.experimentCount, label: 'Экспериментов', color: 'text-emerald-400 bg-emerald-400/20' },
    { icon: Calendar, value: daysOnPlatform, label: 'Дней на платформе', color: 'text-amber-400 bg-amber-400/20' },
    { icon: Trophy, value: stats.rank ? `#${stats.rank}` : '—', label: 'Ранг', color: 'text-white bg-white/20' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((stat, index) => {
        const Icon = stat.icon;
        const [textColor, bgColor] = stat.color.split(' ');

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
              <Icon className={`h-5 w-5 ${textColor}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
