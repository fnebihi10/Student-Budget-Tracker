import { expect, test } from '@jest/globals';
import { databaseRow, payments, activities, periodPlans, demoShape } from '../decoders';
test('malformed cloud and nested JSON values never enter financial state', () => {
  expect(() => databaseRow('bills', { id: 'A', amount: 10 })).toThrow();
  expect(() => activities([{ amount: 'bad', id: 'A', note: '', date: '2026-10-03' }])).toThrow();
  expect(() => payments({ '2026-15': { paidAt: null } })).toThrow();
  expect(() => periodPlans({ '2026-10': { monthlyBudget: 900, categoryBudgets: { food: 'bad' } } })).toThrow();
  expect(payments({ '2026-10': { paidAt: '2026-10-03', amount: 18, operationId: 'A', transactionId: 'A' } })['2026-10'].transactionId).toBe('A');
});
test('demo schema accepts mixed paid/unpaid occurrences and rejects corrupt required fields', () => {
  const sample = [{ id: 'paid', amount: 18, paidMonth: '2026-10' }, { id: 'unpaid', amount: 5, paidMonth: null }];
  expect(demoShape([{ id: 'new', amount: 18, paidMonth: null }], sample)).toEqual([{ id: 'new', amount: 18, paidMonth: null }]);
  expect(() => demoShape([{ id: 'corrupt', amount: 'oops', paidMonth: null }], sample)).toThrow();
});
