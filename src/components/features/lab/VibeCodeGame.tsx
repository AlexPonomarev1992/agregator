'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Gamepad2, Sparkles } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';

const GAME_URL = process.env.NEXT_PUBLIC_VIBECODE_GAME_URL || 'https://vibecode.polimatai.site';

export function VibeCodeGame() {
  const [ssoToken, setSsoToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/game/sso-token', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(`Auth required (${res.status})`);
        return res.json();
      })
      .then((json) => {
        setSsoToken(json.data?.token ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const gameUrl = ssoToken ? `${GAME_URL}/home?sso=${ssoToken}` : GAME_URL;

  const openGame = () => {
    window.open(gameUrl, '_blank', 'noopener');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 max-w-md text-center"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10">
          <Gamepad2 className="h-10 w-10 text-white/80" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">VibeCode — Игровой прогрев</h2>
          <p className="text-sm text-white/50">
            10 уровней от идеи до своего мини-приложения.
            Прогресс синхронизируется с VibeLab.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Button onClick={openGame} className="gap-2 w-full">
            <Sparkles className="h-4 w-4" />
            Играть
            <ExternalLink className="h-3.5 w-3.5 ml-1 text-white/50" />
          </Button>

          <p className="text-xs text-white/30">
            Откроется в новой вкладке для лучшего опыта
          </p>
        </div>
      </motion.div>
    </div>
  );
}
