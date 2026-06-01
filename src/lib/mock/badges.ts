import type { Badge, UserBadge } from '@/types';

export const mockBadges: Badge[] = [
  {
    id: 'badge-001',
    name: 'Первопроходец',
    description: 'Завершить первый эксперимент',
    icon: 'Flame',
  },
  {
    id: 'badge-002',
    name: 'Молния',
    description: 'Сделать 10 генераций за один день',
    icon: 'Zap',
  },
  {
    id: 'badge-003',
    name: 'Чемпион',
    description: 'Попасть в топ-3 рейтинга',
    icon: 'Trophy',
  },
  {
    id: 'badge-004',
    name: 'Восходящая звезда',
    description: 'Набрать 500 XP',
    icon: 'Star',
  },
  {
    id: 'badge-005',
    name: 'Ракета',
    description: 'Набрать 2000 XP',
    icon: 'Rocket',
  },
  {
    id: 'badge-006',
    name: 'Королевская особа',
    description: 'Оформить подписку RoyalPass',
    icon: 'Crown',
  },
  {
    id: 'badge-007',
    name: 'Снайпер',
    description: 'Получить 5 генераций со статусом "done" подряд',
    icon: 'Target',
  },
  {
    id: 'badge-008',
    name: 'Мастер генераций',
    description: 'Сделать 100 генераций',
    icon: 'Award',
  },
  {
    id: 'badge-009',
    name: 'Ветеран',
    description: 'Быть на платформе больше 3 месяцев',
    icon: 'Medal',
  },
  {
    id: 'badge-010',
    name: 'Бриллиант',
    description: 'Завершить все опубликованные эксперименты',
    icon: 'Diamond',
  },
];

export const mockUserBadges: UserBadge[] = [
  { id: 'ub-001', user_id: 'u-003', badge_id: 'badge-001', earned_at: '2026-02-01T14:30:00Z' },
  { id: 'ub-002', user_id: 'u-003', badge_id: 'badge-004', earned_at: '2026-02-15T10:00:00Z' },
  { id: 'ub-003', user_id: 'u-003', badge_id: 'badge-005', earned_at: '2026-03-05T18:00:00Z' },
  { id: 'ub-004', user_id: 'u-003', badge_id: 'badge-006', earned_at: '2026-01-20T12:00:00Z' },
  { id: 'ub-005', user_id: 'u-003', badge_id: 'badge-007', earned_at: '2026-03-10T16:30:00Z' },
  { id: 'ub-006', user_id: 'u-003', badge_id: 'badge-008', earned_at: '2026-03-15T09:00:00Z' },
  { id: 'ub-007', user_id: 'u-003', badge_id: 'badge-009', earned_at: '2026-03-01T00:00:00Z' },
];
