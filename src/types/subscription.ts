export type SubscriptionStatus = 'active' | 'cancelled' | 'expired';

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan: SubscriptionPlan;
  started_at: string;
  expires_at: string;
}
