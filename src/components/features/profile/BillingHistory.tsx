'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Gift, Crown } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/components/ui/icons';

type TransactionType = 'purchase' | 'generation' | 'bonus' | 'subscription';
type BillingFilter = 'all' | 'purchase' | 'generation' | 'bonus';

interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  createdAt: string;
}

const FILTERS: { id: BillingFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'purchase', label: 'Покупки' },
  { id: 'generation', label: 'Списания' },
  { id: 'bonus', label: 'Бонусы' },
];

function getTypeIcon(type: TransactionType): LucideIcon {
  switch (type) {
    case 'purchase': return ArrowUpRight;
    case 'generation': return ArrowDownRight;
    case 'bonus': return Gift;
    case 'subscription': return Crown;
  }
}

function getTypeColor(type: TransactionType): string {
  switch (type) {
    case 'purchase': return 'text-emerald-400 bg-emerald-400/20';
    case 'generation': return 'text-red-400 bg-red-400/20';
    case 'bonus': return 'text-amber-400 bg-amber-400/20';
    case 'subscription': return 'text-white bg-white/20';
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BillingHistory() {
  const [activeFilter, setActiveFilter] = useState<BillingFilter>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/payments/history?limit=50', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        const raw = json.data ?? [];

        // Map credit_transactions from payments history
        const mapped: Transaction[] = raw.map((tx: Record<string, unknown>) => ({
          id: tx.id as string,
          type: tx.paymentType as TransactionType ?? (((tx.amount as number) ?? 0) > 0 ? 'purchase' : 'generation'),
          description: tx.description as string ?? `${tx.paymentType === 'subscription' ? 'Подписка' : 'Платёж'} — ${tx.orderId}`,
          amount: Math.round(((tx.amount as number) ?? 0) / 100), // kopecks to rubles
          createdAt: tx.createdAt as string,
        }));

        setTransactions(mapped);
      } catch {
        // Silently fail
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  const filtered = transactions.filter((tx) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'generation') return tx.type === 'generation' || tx.type === 'subscription';
    return tx.type === activeFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-4"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeFilter === filter.id
                ? 'bg-white text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-12">
          <p className="text-sm text-white/40">Нет транзакций</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/40">Описание</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/40">Сумма</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="wait">
                  {filtered.map((tx, index) => {
                    const Icon = getTypeIcon(tx.type);
                    const [textColor, bgColor] = getTypeColor(tx.type).split(' ');

                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="px-4 py-3 text-sm text-white/60">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                              <Icon className={`h-4 w-4 ${textColor}`} />
                            </div>
                            <span className="text-sm text-white">{tx.description}</span>
                          </div>
                        </td>
                        <td className={cn(
                          'px-4 py-3 text-right text-sm font-medium',
                          tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 md:hidden">
            <AnimatePresence mode="wait">
              {filtered.map((tx, index) => {
                const Icon = getTypeIcon(tx.type);
                const [textColor, bgColor] = getTypeColor(tx.type).split(' ');

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                      <Icon className={`h-5 w-5 ${textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tx.description}</p>
                      <span className="text-xs text-white/40">{formatDate(tx.createdAt)}</span>
                    </div>
                    <span className={cn(
                      'text-sm font-medium shrink-0',
                      tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} ₽
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  );
}
