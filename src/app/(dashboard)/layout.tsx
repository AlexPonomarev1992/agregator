'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/user-store';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const setCredits = useUserStore((s) => s.setCredits);
  const setSubscription = useUserStore((s) => s.setSubscription);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadUserData() {
      try {
        // Fetch user profile (will fail with 401 if not authenticated)
        const profileRes = await fetch('/api/user/profile', {
          credentials: 'include',
        });
        if (!profileRes.ok) {
          window.location.href = '/login';
          return;
        }

        const profileData = await profileRes.json();
        const profile = profileData.data;

        if (cancelled) return;

        // Populate Zustand stores with real data
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          avatar_url: profile.avatarUrl,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        });

        setCredits({
          id: profile.id,
          user_id: profile.id,
          balance: profile.credits.balance,
          total_bought: profile.credits.totalBought,
          total_spent: profile.credits.totalSpent,
          updated_at: profile.updatedAt,
        });

        if (profile.subscription) {
          setSubscription({
            id: profile.subscription.id,
            user_id: profile.id,
            status: profile.subscription.status,
            plan: profile.subscription.plan,
            started_at: profile.subscription.startedAt ?? '',
            expires_at: profile.subscription.expiresAt,
          });
        } else {
          setSubscription(null);
        }
      } catch {
        router.replace('/login');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUserData();

    return () => {
      cancelled = true;
    };
  }, [router, setUser, setCredits, setSubscription]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
          <p className="text-sm text-white/50">Загрузка...</p>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
