import { nextRenewal, civilDay, renewalsBetween } from '../domain/calendar';
import type { Recurrence } from '../domain/calendar';
type Subscription = Recurrence & { amount: number; status: string };
export { renewalsBetween };

export const monthlyEquivalent = (subscription: Pick<Subscription, 'amount' | 'frequency'>) => {
  const amount = Number(subscription.amount) || 0;
  if (subscription.frequency === "yearly") return amount / 12;
  if (subscription.frequency === "weekly") return (amount * 52) / 12;
  return amount;
};

export const yearlyEquivalent = (subscription: Pick<Subscription, 'amount' | 'frequency'>) =>
  monthlyEquivalent(subscription) * 12;

export const activeSubscriptionTotal = (subscriptions: readonly Subscription[]) =>
  subscriptions
    .filter((item) => item.status === "active")
    .reduce((sum, item) => sum + monthlyEquivalent(item), 0);

export const getNextRenewal = (subscription: Recurrence, from = new Date()) => nextRenewal(subscription, from);

export const daysUntil = (date: Date | string, from = new Date()) => {
  const start = civilDay(from);
  const end = civilDay(date);
  return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / 86400000));
};

export const upcomingSubscriptions = <T extends Subscription>(subscriptions: readonly T[], count = 4) =>
  subscriptions
    .filter((item) => item.status === "active")
    .map((item) => ({ ...item, renewalDate: getNextRenewal(item) }))
    .sort((a, b) => a.renewalDate.getTime() - b.renewalDate.getTime())
    .slice(0, count);

