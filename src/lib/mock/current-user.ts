import type { UserProfile, UserCredits, UserRating, Subscription } from '@/types';
import type { UserBadge } from '@/types';

export const currentUser: UserProfile = {
  id: 'u-003',
  email: 'dmitry@example.com',
  name: 'Дмитрий Волков',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Dmitry',
  created_at: '2025-10-20T12:00:00Z',
  updated_at: '2026-03-18T16:45:00Z',
  bio: 'AI-энтузиаст и вайбкодер. Создаю контент будущего с помощью нейросетей.',
  isCreator: true,
  socialLinks: [
    { platform: 'youtube', url: 'https://youtube.com/@dmitryvolkov' },
    { platform: 'telegram', url: 'https://t.me/dmitryvolkov' },
    { platform: 'instagram', url: 'https://instagram.com/dmitryvolkov' },
  ],
};

export const currentUserCredits: UserCredits = {
  id: 'uc-003',
  user_id: 'u-003',
  balance: 150,
  total_bought: 500,
  total_spent: 350,
  updated_at: '2026-03-18T16:45:00Z',
};

export const currentUserRating: UserRating = {
  user_id: 'u-003',
  total_xp: 3200,
  rank: 7,
  badges_count: 7,
  updated_at: '2026-03-18T00:00:00Z',
};

export const currentUserSubscription: Subscription = {
  id: 'sub-001',
  user_id: 'u-003',
  status: 'active',
  plan: 'monthly',
  started_at: '2026-03-01T00:00:00Z',
  expires_at: '2026-04-01T00:00:00Z',
};

export const currentUserBadges: UserBadge[] = [
  { id: 'ub-001', user_id: 'u-003', badge_id: 'badge-001', earned_at: '2026-02-01T14:30:00Z' },
  { id: 'ub-002', user_id: 'u-003', badge_id: 'badge-004', earned_at: '2026-02-15T10:00:00Z' },
  { id: 'ub-003', user_id: 'u-003', badge_id: 'badge-005', earned_at: '2026-03-05T18:00:00Z' },
  { id: 'ub-004', user_id: 'u-003', badge_id: 'badge-006', earned_at: '2026-01-20T12:00:00Z' },
  { id: 'ub-005', user_id: 'u-003', badge_id: 'badge-007', earned_at: '2026-03-10T16:30:00Z' },
  { id: 'ub-006', user_id: 'u-003', badge_id: 'badge-008', earned_at: '2026-03-15T09:00:00Z' },
  { id: 'ub-007', user_id: 'u-003', badge_id: 'badge-009', earned_at: '2026-03-01T00:00:00Z' },
];
