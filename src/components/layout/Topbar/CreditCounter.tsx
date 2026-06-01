'use client';

import { Coins } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'framer-motion';
import { useUserStore } from '@/lib/stores/user-store';

export const CreditCounter = () => {
  const balance = useUserStore((s) => s.credits?.balance ?? 0);

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
      <Coins className="h-4 w-4 text-white" />
      <AnimatePresence mode="wait">
        <motion.span
          key={balance}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.15 }}
          className="text-sm font-medium text-white tabular-nums"
        >
          {balance}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};
