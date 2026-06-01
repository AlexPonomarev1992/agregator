'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown } from '@/components/ui/icons';
import { usePathname, useSearchParams } from 'next/navigation';
import { useUiStore } from '@/lib/stores/ui-store';
import { topNavItems, bottomNavItems } from '@/lib/constants/navigation';
import { NavItem } from './NavItem';
import { ChatList } from './ChatList';

export const Sidebar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const currentChatId = searchParams.get('chat');

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 220 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="fixed left-0 top-0 z-40 hidden h-screen flex-col bg-zinc-950/80 backdrop-blur-xl border-r border-white/10 lg:flex"
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-white/5 flex-shrink-0">
        <AnimatePresence mode="wait">
          {sidebarCollapsed ? (
            <motion.span
              key="collapsed-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold bg-gradient-to-r from-white/40 to-white/20 bg-clip-text text-transparent"
            >
              V
            </motion.span>
          ) : (
            <motion.span
              key="expanded-logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold bg-gradient-to-r from-white/40 to-white/20 bg-clip-text text-transparent"
            >
              VibeLab
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Top navigation group */}
      <nav className="space-y-1 px-2 pt-4 flex-shrink-0">
        {topNavItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={pathname.startsWith(item.href)}
            isCollapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Divider */}
      {!sidebarCollapsed && (
        <div className="mx-4 mt-3 border-t border-white/5" />
      )}

      {/* Chat list — flex-1 with overflow-y */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0" style={{ scrollbarWidth: 'none' }}>
        <ChatList isCollapsed={sidebarCollapsed} currentChatId={currentChatId} />
      </div>

      {/* Divider */}
      {!sidebarCollapsed && (
        <div className="mx-4 border-t border-white/5" />
      )}

      {/* Bottom navigation group */}
      <nav className="space-y-1 px-2 py-3 flex-shrink-0">
        {bottomNavItems.map((item) => (
          <NavItem
            key={item.href}
            icon={item.icon}
            label={item.label}
            href={item.href}
            isActive={pathname.startsWith(item.href)}
            isCollapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* RoyalPass CTA */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-4 flex-shrink-0"
          >
            <div className="rounded-xl bg-gradient-to-br from-[#7F77DD]/20 to-white/5 border border-[#7F77DD]/20 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-[#7F77DD]" />
                <span className="text-sm font-semibold text-white">RoyalPass</span>
              </div>
              <p className="text-xs text-white/50">
                Открой все возможности
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed RoyalPass icon */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center pb-4 flex-shrink-0"
          >
            <div className="rounded-lg bg-gradient-to-br from-[#7F77DD]/20 to-white/5 border border-[#7F77DD]/20 p-2">
              <Crown className="h-4 w-4 text-[#7F77DD]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};
