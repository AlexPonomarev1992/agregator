export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  platform: 'youtube' | 'instagram' | 'tiktok' | 'telegram' | 'twitter';
  url: string;
}

export interface UserProfile extends User {
  bio?: string;
  socialLinks?: SocialLink[];
  isCreator?: boolean;
}

export interface UserCredits {
  id: string;
  user_id: string;
  balance: number;
  total_bought: number;
  total_spent: number;
  updated_at: string;
}

export interface UserRating {
  user_id: string;
  total_xp: number;
  rank: number;
  badges_count: number;
  updated_at: string;
}
