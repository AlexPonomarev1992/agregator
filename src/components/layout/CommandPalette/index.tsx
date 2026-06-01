'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  MessageSquare,
  FlaskConical,
  Trophy,
  User,
  Settings,
  FolderPlus,
  Coins,
  Sparkles,
  Video,
  Clapperboard,
  Banana,
} from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { LucideIcon } from '@/components/ui/icons';

interface CommandItem {
  id: string;
  label: string;
  section: string;
  icon: LucideIcon;
  href?: string;
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  // Navigation
  { id: 'nav-content', label: 'Контент', section: 'Навигация', icon: LayoutGrid, href: '/content' },
  { id: 'nav-assistant', label: 'ИИ-ассистент', section: 'Навигация', icon: MessageSquare, href: '/assistant' },
  { id: 'nav-lab', label: 'Лаборатория', section: 'Навигация', icon: FlaskConical, href: '/lab' },
  { id: 'nav-rating', label: 'Рейтинг', section: 'Навигация', icon: Trophy, href: '/rating' },
  { id: 'nav-profile', label: 'Профиль', section: 'Навигация', icon: User, href: '/profile' },
  { id: 'nav-settings', label: 'Настройки', section: 'Навигация', icon: Settings, href: '/profile/settings' },
  // Actions
  { id: 'act-new-project', label: 'Новый проект', section: 'Действия', icon: FolderPlus, href: '/assistant' },
  { id: 'act-buy-credits', label: 'Купить кредиты', section: 'Действия', icon: Coins, href: '/profile' },
  { id: 'act-generate', label: 'Начать генерацию', section: 'Действия', icon: Sparkles, href: '/content' },
  // Models
  { id: 'model-kling', label: 'Kling 3.0', section: 'Модели', icon: Clapperboard, href: '/content' },
  { id: 'model-sora', label: 'Sora 2', section: 'Модели', icon: Video, href: '/content' },
  { id: 'model-nanobanana', label: 'Nano Banana 2', section: 'Модели', icon: Banana, href: '/content' },
];

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = useMemo(() => {
    if (!query) return COMMANDS;
    const lowerQuery = query.toLowerCase();
    return COMMANDS.filter((cmd) =>
      cmd.label.toLowerCase().includes(lowerQuery)
    );
  }, [query]);

  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const cmd of filtered) {
      const items = map.get(cmd.section) ?? [];
      items.push(cmd);
      map.set(cmd.section, items);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatItems = filtered;

  const selectItem = useCallback(
    (item: CommandItem) => {
      if (item.href) {
        router.push(item.href);
      }
      onClose();
      setQuery('');
      setSelectedIndex(0);
    },
    [router, onClose]
  );

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input on next tick
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          selectItem(flatItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [flatItems, selectedIndex, selectItem, onClose]
  );

  // Reset selected index when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
          >
            <div
              className="mx-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
              onKeyDown={handleKeyDown}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/10 px-4">
                <Search className="h-4 w-4 text-white/40 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск команд..."
                  className="h-12 flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/10 bg-white/5 px-1.5 text-[10px] text-white/40">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-[300px] overflow-y-auto p-2">
                {flatItems.length === 0 ? (
                  <div className="py-8 text-center text-sm text-white/40">
                    Ничего не найдено
                  </div>
                ) : (
                  sections.map(([section, items]) => (
                    <div key={section} className="mb-2 last:mb-0">
                      <p className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/30">
                        {section}
                      </p>
                      {items.map((item) => {
                        const globalIndex = flatItems.indexOf(item);
                        const Icon = item.icon;
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <button
                            key={item.id}
                            onClick={() => selectItem(item)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/5'
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut && (
                              <kbd className="text-[10px] text-white/30">{item.shortcut}</kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-white/10 px-4 py-2 text-[10px] text-white/30">
                <span>&#8593;&#8595; навигация</span>
                <span>&#9166; выбрать</span>
                <span>esc закрыть</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
