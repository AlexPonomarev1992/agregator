'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Award,
  Video,
  TrendingUp,
  Coins,
  Image,
  Crown,
  Sparkles,
  Zap,
  RefreshCw,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/components/ui/icons';

type NotificationType = 'badge' | 'generation' | 'rank' | 'system' | 'credits' | 'subscription' | 'xp';

interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  iconName: string;
  isRead: boolean;
  createdAt: string;
}

type NotificationFilter = 'all' | 'badge' | 'system';

const ICON_MAP: Record<string, LucideIcon> = {
  Award,
  Video,
  TrendingUp,
  Coins,
  Image,
  Crown,
  Sparkles,
  Zap,
  RefreshCw,
};

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case 'badge': return 'text-amber-400';
    case 'generation': return 'text-blue-400';
    case 'rank': return 'text-emerald-400';
    case 'credits': return 'text-amber-400';
    case 'xp': return 'text-purple-400';
    case 'subscription': return 'text-white';
    case 'system': return 'text-white/60';
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(dateStr).toLocaleDateString('ru-RU');
}

function NotificationItem({ notification }: { notification: AppNotification }) {
  const Icon = ICON_MAP[notification.iconName] ?? Bell;
  const color = getNotificationColor(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 transition-colors hover:bg-white/5',
        !notification.isRead && 'border-l-2 border-l-[#7F77DD] bg-white/[0.02]'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm', notification.isRead ? 'text-white/60' : 'text-white font-medium')}>
          {notification.title}
        </p>
        <p className="text-xs text-white/40 mt-0.5">{notification.description}</p>
        <p className="text-[10px] text-white/30 mt-1">{timeAgo(notification.createdAt)}</p>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (!res.ok) return;
      const json = await res.json();
      setNotifications(json.data?.items ?? []);
      setUnreadCount(json.data?.unreadCount ?? 0);
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Refetch when panel opens
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'badge') return n.type === 'badge';
    return n.type === 'system';
  });

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', credentials: 'include' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        aria-label="Уведомления"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-white">Уведомления</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-white hover:text-[#9B8FEE] transition-colors"
                >
                  Прочитать все
                </button>
              )}
            </div>

            <div className="flex gap-1 px-4 py-2 border-b border-white/5">
              {([
                { id: 'all' as const, label: 'Все' },
                { id: 'badge' as const, label: 'Бейджи' },
                { id: 'system' as const, label: 'Система' },
              ]).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                    filter === f.id
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/50 hover:bg-white/10'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="max-h-[360px] overflow-y-auto divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm text-white/40">Нет уведомлений</p>
                </div>
              ) : (
                filtered.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
