'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, Loader2, Gamepad2 } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const GAME_URL = process.env.NEXT_PUBLIC_VIBECODE_GAME_URL || 'https://vibecode.polimatai.site';

export default function GameLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: check if already logged in → redirect to game with SSO
  useEffect(() => {
    redirectToGameIfLoggedIn().finally(() => setChecking(false));
  }, []);

  async function redirectToGameIfLoggedIn() {
    try {
      const res = await fetch('/api/game/sso-token', {
        credentials: 'include',
      });
      if (!res.ok) return; // not logged in

      const json = await res.json();
      const token = json.data?.token;
      if (token) {
        window.location.href = `${GAME_URL}/home?sso=${token}`;
      }
    } catch {
      // not logged in — show form
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Login to VibeLab
      const loginRes = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!loginRes.ok) {
        const data = await loginRes.json().catch(() => null);
        setError(data?.message || 'Не удалось войти. Проверьте данные.');
        return;
      }

      // Step 2: Get SSO token
      const ssoRes = await fetch('/api/game/sso-token', {
        method: 'POST',
        credentials: 'include',
      });

      if (!ssoRes.ok) {
        setError('Ошибка генерации токена. Попробуйте ещё раз.');
        return;
      }

      const ssoJson = await ssoRes.json();
      const token = ssoJson.data?.token;

      if (!token) {
        setError('Не удалось получить токен.');
        return;
      }

      // Step 3: Redirect to game with SSO token
      window.location.href = `${GAME_URL}/home?sso=${token}`;
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/50">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-white/40 to-[#6B5FCC] shadow-lg shadow-white/10">
          <Gamepad2 className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Вход в VibeCode</h1>
        <p className="text-sm text-white/50 text-center">
          Войдите через VibeLab аккаунт, чтобы играть с синхронизацией прогресса
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-white/60" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-white/60" htmlFor="password">
            Пароль
          </label>
          <Input
            id="password"
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Вход...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Войти и перейти в игру
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-white/40">
        Нет аккаунта VibeLab?{' '}
        <Link href="/signup" className="text-white hover:underline">
          Создать
        </Link>
      </p>
    </motion.div>
  );
}
