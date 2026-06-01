'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Tooltip } from '@/components/ui/tooltip';
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

interface NavItemProps {
  icon: string;
  label: string;
  href: string;
  isActive: boolean;
  isCollapsed: boolean;
}

export const NavItem = ({ icon, label, href, isActive, isCollapsed }: NavItemProps) => {
  const IconComponent = iconMap[icon];

  const content = (
    <motion.div
      whileHover={{ backgroundColor: isActive ? undefined : 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative',
        isActive
          ? 'bg-white/10 text-white border-l-2 border-white'
          : 'text-white/60 hover:text-white border-l-2 border-transparent',
        isCollapsed && 'justify-center px-0'
      )}
    >
      {IconComponent && <IconComponent className="h-5 w-5 shrink-0" />}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        <Link href={href} className="block">
          {content}
        </Link>
      </Tooltip>
    );
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
};
