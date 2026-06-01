'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUiStore } from '@/lib/stores/ui-store';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CommandPalette } from '@/components/layout/CommandPalette';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-white">
      {/* Sidebar - desktop only */}
      <Sidebar />

      {/* Main area — offset by sidebar width on desktop */}
      <div
        className={cn(
          'flex flex-1 flex-col overflow-hidden transition-[margin] duration-200',
          sidebarCollapsed ? 'lg:ml-[56px]' : 'lg:ml-[220px]'
        )}
      >
        <Topbar />

        {/* Content area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </main>

        {/* Bottom nav - mobile only */}
        <BottomNav />
      </div>

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};
