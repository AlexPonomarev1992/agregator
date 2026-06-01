'use client';

import { Menu } from '@/components/ui/icons';
import { motion } from 'framer-motion';
import { useUiStore } from '@/lib/stores/ui-store';
import { CreditCounter } from './CreditCounter';
import { UserMenu } from './UserMenu';
import { NotificationCenter } from '@/components/layout/NotificationCenter';

export const Topbar = () => {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);

  return (
    <header className="z-30 flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </motion.button>
        {/* Show logo text on mobile or when sidebar is collapsed */}
        <span
          className={`text-lg font-bold bg-gradient-to-r from-white/40 to-white/20 bg-clip-text text-transparent ${
            sidebarCollapsed ? 'lg:inline' : 'lg:hidden'
          }`}
        >
          VibeLab
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <CreditCounter />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
};
