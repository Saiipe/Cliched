export type SubscriptionStatus = 'active' | 'canceled' | 'expired';
export type SubscriptionInterval = 'monthly' | 'yearly';

export interface Subscription {
  readonly id: string;
  readonly interval: SubscriptionInterval;
  readonly status: SubscriptionStatus;
  readonly renewsAt: string;
}
