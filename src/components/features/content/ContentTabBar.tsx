'use client';

import { motion } from 'framer-motion';
import { Home, Image, Video, LayoutGrid, Palette, type LucideIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import type { ContentTab } from '@/types';

interface TabItem {
  id: ContentTab;
  label: string;
  icon: LucideIcon;
}

const tabs: TabItem[] = [
  { id: 'home', label: 'Главная', icon: Home },
  { id: 'images', label: 'Изображения', icon: Image },
  { id: 'video', label: 'Видео', icon: Video },
  { id: 'carousels', label: 'Карусели', icon: LayoutGrid },
  { id: 'creative-studio', label: 'Творческая студия', icon: Palette },
];

interface ContentTabBarProps {
  activeTab: ContentTab;
  onTabChange: (tab: ContentTab) => void;
}

export function ContentTabBar({ activeTab, onTabChange }: ContentTabBarProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-1 border-b border-white/10 overflow-x-auto scrollbar-hide shrink-0">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-colors',
              isActive
                ? 'text-white'
                : 'text-white/50 hover:text-white/80'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId="content-tab-indicator"
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-white rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
