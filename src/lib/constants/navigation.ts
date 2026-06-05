import type { NavItem } from '@/types';

export const navigationItems: NavItem[] = [
  { icon: 'Cpu', label: 'Агент', href: '/ai', section: 'top' },
  { icon: 'Layers', label: 'Studio', href: '/studio', section: 'top' },
  { icon: 'Clock', label: 'История', href: '/history', section: 'top' },
  { icon: 'FlaskConical', label: 'Лаборатория', href: '/lab', section: 'bottom' },
  { icon: 'Trophy', label: 'Рейтинг', href: '/rating', section: 'bottom' },
  { icon: 'User', label: 'Профиль', href: '/profile', section: 'bottom' },
  { icon: 'Settings', label: 'Настройки', href: '/profile/settings', section: 'bottom' },
];

export const topNavItems = navigationItems.filter((i) => i.section === 'top');
export const bottomNavItems = navigationItems.filter((i) => i.section === 'bottom');

// BottomNav shows only key 5 items on mobile (no settings)
export const mobileNavItems = navigationItems.filter(
  (i) => i.section === 'top' || ['FlaskConical', 'Trophy', 'User'].includes(i.icon)
);


1+1

1.0+1.0



