'use client';

import { motion } from 'framer-motion';
import { Crown, Check } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserStore } from '@/lib/stores/user-store';

const BENEFITS = [
  'Эксклюзивные эксперименты',
  'Видеоуроки по генерации',
  'Групповые созвоны',
  'Закрытый Telegram чат',
];

export function SubscriptionCard() {
  const subscription = useUserStore((s) => s.subscription);

  const isActive = subscription?.status === 'active';
  const expiresDate = subscription?.expires_at
    ? new Date(subscription.expires_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md p-6 overflow-hidden"
    >
      {/* Gradient border accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-white/40 to-[#9B8FEE]" />

      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">RoyalPass</h3>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? 'success' : 'destructive'}>
              {isActive ? 'Активна' : 'Неактивна'}
            </Badge>
            {expiresDate && (
              <span className="text-xs text-white/40">до {expiresDate}</span>
            )}
          </div>
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center gap-2 text-sm text-white/70">
            <Check className="h-3.5 w-3.5 text-white shrink-0" />
            {benefit}
          </li>
        ))}
      </ul>

      <Button variant="secondary" className="w-full">
        {isActive ? 'Управить подпиской' : 'Оформить подписку'}
      </Button>
    </motion.div>
  );
}
