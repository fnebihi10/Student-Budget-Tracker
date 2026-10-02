import { Bill, Transaction, parseMinor } from './finance';
import { Recurrence, monthStart, renewalsBetween, monthDays } from './calendar';

export type Commitment = Recurrence & { amount: number; status: string };
export function budgetEstimate({ budget, transactions, bills, subscriptions, debts, now = new Date() }: {
  budget: number; transactions: Transaction[]; bills: Bill[];
  subscriptions: Commitment[]; debts: { amount: number; direction: string; status: string }[]; now?: Date;
}) {
  const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const actualExpenses = transactions.filter((t) => t.type === 'expense' && t.date.slice(0, 7) === key)
    .reduce((n, t) => n + parseMinor(t.amount), 0);
  const billReserve = bills.filter((b) => !(b.paymentHistory?.[key] || b.paidMonth === key))
    .reduce((n, b) => n + parseMinor(b.amount), 0);
  const subscriptionReserve = subscriptions.filter((s) => s.status === 'active')
    .reduce((n, s) => n + renewalsBetween(s, now, monthStart(now, 1)).length * parseMinor(s.amount), 0);
  const debtReserve = debts.filter((d) => d.direction === 'i_owe' && d.status === 'open')
    .reduce((n, d) => n + parseMinor(d.amount), 0);
  const daysLeft = monthDays(now.getUTCFullYear(), now.getUTCMonth()) - now.getUTCDate() + 1;
  const remainder = Math.max(0, parseMinor(budget) - actualExpenses - billReserve - subscriptionReserve - debtReserve);
  return {
    estimate: Math.floor(remainder * Math.min(7, daysLeft) / daysLeft) / 100,
    reserved: (billReserve + subscriptionReserve + debtReserve) / 100,
    days: Math.min(7, daysLeft),
    assumptions: 'Budget estimate, not available cash. Reserves unpaid bills, future subscription renewals and all open debts you owe. Mark bills/debts paid or settled after recording their transactions; advance subscription renewal dates after payments. Use one tracker per obligation: duplicate bill/subscription trackers are reserved separately. No matching is inferred. Savings transfers are tracked separately and are not spending.',
  };
}
