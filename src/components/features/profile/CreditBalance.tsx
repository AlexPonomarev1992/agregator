'use client';

import { motion } from 'framer-motion';
import { Coins } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/lib/stores/user-store';

const PACKAGES = [
  { amount: 50, price: 299 },
  { amount: 150, price: 799 },
  { amount: 500, price: 1999 },
];

export function CreditBalance() {
  const credits = useUserStore((s) => s.credits);
  const balance = credits?.balance ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20">
          <Coins className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-white/40">Баланс</p>
          <motion.p
            key={balance}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-white"
          >
            {balance} <span className="text-sm font-normal text-white/40">кредитов</span>
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.amount}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center"
          >
            <span className="text-sm font-semibold text-white">{pkg.amount}</span>
            <span className="text-[10px] text-white/40">кредитов</span>
            <span className="text-xs font-medium text-white">{pkg.price} &#8381;</span>
            <Button size="sm" className="mt-1 w-full text-xs h-7">
              Купить
            </Button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
