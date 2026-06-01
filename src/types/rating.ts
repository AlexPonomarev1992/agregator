import type { User, UserRating } from './user';

export interface LeaderboardEntry {
  user: User;
  rating: UserRating;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
}
