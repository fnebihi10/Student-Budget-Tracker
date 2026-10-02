import { expect, test } from '@jest/globals';
import { monthStart, nextRenewal, renewalsBetween } from '../calendar';
import { budgetEstimate } from '../budgetEstimate';

test('March 31 produces four distinct report months including February', () => {
  const day = new Date('2026-03-31T12:00:00Z');
  expect([3, 2, 1, 0].map((offset) => monthStart(day, -offset).toISOString().slice(0, 7)))
    .toEqual(['2025-12', '2026-01', '2026-02', '2026-03']);
});
test('month-end, leap-day and weekly recurrences retain original anchor', () => {
  const monthly = { nextBillingDate: '2026-01-31T12:00:00Z', frequency: 'monthly' as const };
  expect(renewalsBetween(monthly, new Date('2026-02-01'), new Date('2026-04-01')).map((d) => d.toISOString().slice(0, 10)))
    .toEqual(['2026-02-28', '2026-03-31']);
  expect(nextRenewal({ nextBillingDate: '2024-02-29', frequency: 'yearly' }, new Date('2028-01-01')).toISOString().slice(0, 10)).toBe('2028-02-29');
  expect(renewalsBetween({ nextBillingDate: '2026-03-01', frequency: 'weekly' }, new Date('2026-03-01'), new Date('2026-04-01'))).toHaveLength(5);
});
test('reserve unpaid obligations and cap last-day estimate to remaining month', () => {
  const now = new Date('2026-10-31T12:00:00Z');
  const base = { budget: 100, transactions: [], subscriptions: [], debts: [], now };
  const bill = { id: 'b', title: 'Phone', amount: 20, category: 'other', dueDay: 31, paidMonth: null };
  expect(budgetEstimate({ ...base, bills: [bill] }).estimate).toBe(80);
  expect(budgetEstimate({ ...base, bills: [{ ...bill, paidMonth: '2026-10' }], transactions: [{ id: 't', title: 'Phone', amount: 20, type: 'expense', category: 'other', date: now.toISOString() }] }).estimate).toBe(80);
  expect(budgetEstimate({ ...base, bills: [], subscriptions: [{ amount: 10, status: 'active', frequency: 'weekly', nextBillingDate: now.toISOString() }] }).estimate).toBe(90);
});
