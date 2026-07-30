export const monthlyEquivalent = (subscription) => {
  const amount = Number(subscription.amount) || 0;
  if (subscription.frequency === "yearly") return amount / 12;
  if (subscription.frequency === "weekly") return (amount * 52) / 12;
  return amount;
};

export const yearlyEquivalent = (subscription) =>
  monthlyEquivalent(subscription) * 12;

export const activeSubscriptionTotal = (subscriptions) =>
  subscriptions
    .filter((item) => item.status === "active")
    .reduce((sum, item) => sum + monthlyEquivalent(item), 0);

const dateAtNoon = (value) => {
  const date = new Date(value);
  date.setHours(12, 0, 0, 0);
  return date;
};

export const getNextRenewal = (subscription, from = new Date()) => {
  const base = dateAtNoon(subscription.nextBillingDate || from);
  const today = dateAtNoon(from);

  const renewalDay = base.getDate();

  while (base < today) {
    if (subscription.frequency === "yearly") {
      base.setFullYear(base.getFullYear() + 1);
    } else if (subscription.frequency === "weekly") {
      base.setDate(base.getDate() + 7);
    } else {
      base.setDate(1);
      base.setMonth(base.getMonth() + 1);
      const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
      base.setDate(Math.min(renewalDay, lastDay));
    }
  }

  return base;
};

export const daysUntil = (date, from = new Date()) => {
  const start = dateAtNoon(from);
  const end = dateAtNoon(date);
  return Math.max(0, Math.ceil((end - start) / 86400000));
};

export const upcomingSubscriptions = (subscriptions, count = 4) =>
  subscriptions
    .filter((item) => item.status === "active")
    .map((item) => ({ ...item, renewalDate: getNextRenewal(item) }))
    .sort((a, b) => a.renewalDate - b.renewalDate)
    .slice(0, count);
