'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Wand2,
  MessageSquare,
  FlaskConical,
  Trophy,
  User,
  Layers,
  Clock,
  Cpu,
  Settings,
  type LucideIcon,
} from '@/components/ui/icons';
import { mobileNavItems } from '@/lib/constants/navigation';
import { cn } from '@/lib/utils';

const iconMap: Record<string, LucideIcon> = {
  Wand2,
  MessageSquare,
  FlaskConical,
  Trophy,
  User,
  Layers,
  Clock,
  Cpu,
  Settings,
};

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 block lg:hidden">
      <div className="flex h-16 items-center justify-around border-t border-white/10 bg-zinc-950/90 backdrop-blur-xl px-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const IconComponent = iconMap[item.icon];

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-1"
            >
              {isActive && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute -top-px left-3 right-3 h-0.5 rounded-full bg-white"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {IconComponent && (
                <IconComponent
                  className={cn(
                    'h-5 w-5 transition-colors',
                    isActive ? 'text-white' : 'text-white/50'
                  )}
                />
              )}
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-white' : 'text-white/50'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
