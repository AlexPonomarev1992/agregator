'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserRankCard } from './UserRankCard';
import { Leaderboard } from './Leaderboard';
import { BadgeGrid } from './BadgeGrid';

// API response types (camelCase from Drizzle)
interface ApiUserRating {
  userId: string;
  totalXp: number;
  rank: number | null;
  badgesCount: number;
}

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

interface ApiBadge {
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

export function RatingPage() {
  const [myRating, setMyRating] = useState<ApiUserRating | null>(null);
  const [leaderboard, setLeaderboard] = useState<ApiLeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRatingData() {
      try {
        const [meRes, boardRes, badgesRes] = await Promise.all([
          fetch('/api/rating/me'),
          fetch('/api/rating/leaderboard?page=1&limit=20'),
          fetch('/api/rating/badges'),
        ]);

        if (meRes.ok) {
          const meJson = await meRes.json();
          setMyRating(meJson.data ?? null);
        }

        if (boardRes.ok) {
          const boardJson = await boardRes.json();
          setLeaderboard(boardJson.data ?? []);
        }

        if (badgesRes.ok) {
          const badgesJson = await badgesRes.json();
          setBadges(badgesJson.data ?? []);
        }
      } catch (error) {
        console.error('[RatingPage] Failed to load rating data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadRatingData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/50">Загрузка рейтинга...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-white"
      >
        Рейтинг
      </motion.h1>

      <UserRankCard myRating={myRating} />
      <Leaderboard entries={leaderboard} />
      <BadgeGrid userBadges={badges} />
    </div>
  );
}
