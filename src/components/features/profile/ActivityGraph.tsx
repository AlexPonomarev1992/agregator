'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame } from '@/components/ui/icons';

const MONTH_LABELS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const DAY_LABELS = ['Пн', '', 'Ср', '', 'Пт', '', ''];
const WEEKS = 12;
const DAYS_PER_WEEK = 7;

interface DayData {
  date: Date;
  xp: number;
}

interface XpEvent {
  amount: number;
  createdAt: string;
}

function buildActivityData(events: XpEvent[]): DayData[] {
  const data: DayData[] = [];
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const totalDays = WEEKS * DAYS_PER_WEEK;

  // Build map: dateStr → totalXp
  const xpByDay = new Map<string, number>();
  for (const event of events) {
    const d = new Date(event.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    xpByDay.set(key, (xpByDay.get(key) ?? 0) + event.amount);
  }

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    data.push({ date, xp: xpByDay.get(key) ?? 0 });
  }

  return data;
}

function calculateStreak(data: DayData[]): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].xp > 0) streak++;
    else break;
  }
  return streak;
}

function getColorClass(xp: number): string {
  if (xp === 0) return 'bg-white/5';
  if (xp < 50) return 'bg-white/20';
  if (xp < 150) return 'bg-white/40';
  if (xp < 250) return 'bg-white/60';
  return 'bg-white/80';
}

function formatDayDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function ActivityGraph() {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [xpEvents, setXpEvents] = useState<XpEvent[]>([]);

  useEffect(() => {
    fetch('/api/rating/me', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);

    // Load XP events for activity graph
    fetch('/api/rating/xp-events', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.data) setXpEvents(json.data);
      })
      .catch(() => {});
  }, []);

  const data = useMemo(() => buildActivityData(xpEvents), [xpEvents]);
  const totalXp = data.reduce((sum, d) => sum + d.xp, 0);
  const bestDay = Math.max(...data.map((d) => d.xp), 0);
  const streak = useMemo(() => calculateStreak(data), [data]);

  // Build grid: columns = weeks, rows = days
  const grid: DayData[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: DayData[] = [];
    for (let d = 0; d < DAYS_PER_WEEK; d++) {
      const index = w * DAYS_PER_WEEK + d;
      week.push(data[index]);
    }
    grid.push(week);
  }

  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const month = grid[w][0].date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ label: MONTH_LABELS[month], col: w });
      lastMonth = month;
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Активность</h3>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-white/60">
            <Flame className="h-4 w-4 text-orange-400" />
            <span>{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-0.5">
          <div className="flex flex-col gap-0.5 pr-2">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="flex h-3 w-6 items-center text-[9px] text-white/40">
                {label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5 mb-1">
              {grid.map((_, w) => {
                const monthLabel = monthLabels.find((m) => m.col === w);
                return (
                  <div key={w} className="w-3 text-[9px] text-white/40">
                    {monthLabel?.label ?? ''}
                  </div>
                );
              })}
            </div>

            {Array.from({ length: DAYS_PER_WEEK }).map((_, dayIndex) => (
              <div key={dayIndex} className="flex gap-0.5">
                {grid.map((week, weekIndex) => {
                  const cellIndex = weekIndex * DAYS_PER_WEEK + dayIndex;
                  const cellData = week[dayIndex];

                  return (
                    <div
                      key={weekIndex}
                      className="relative"
                      onMouseEnter={() => setHoveredCell(cellIndex)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div className={`h-3 w-3 rounded-sm transition-colors ${getColorClass(cellData.xp)}`} />
                      {hoveredCell === cellIndex && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-zinc-900/95 px-2.5 py-1.5 text-[11px] text-white shadow-xl backdrop-blur-xl">
                          <span className="font-medium">{cellData.xp} XP</span>
                          <span className="text-white/40"> — {formatDayDate(cellData.date)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/50">
        <span>За 12 недель: <span className="text-white/70 font-medium">{totalXp.toLocaleString('ru-RU')} XP</span></span>
        {bestDay > 0 && <span>Лучший день: <span className="text-white/70 font-medium">{bestDay} XP</span></span>}
        {streak > 0 && <span>Текущая серия: <span className="text-white/70 font-medium">{streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</span></span>}
      </div>
    </motion.div>
  );
}
