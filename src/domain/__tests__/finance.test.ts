import { expect, test } from '@jest/globals';
import { parseMinor, positiveMoney, sumMoney, contribute, openingBalance, recordBillPayment, clearBillPayment } from '../finance';

test('decimal inputs, boundaries and integer aggregates', () => {
  expect(parseMinor('0,10')).toBe(10);
  expect(sumMoney([0.1, 0.2, -0.1])).toBe(0.2);
  expect(positiveMoney('9999999999.99')).toBe(9999999999.99);
  for (const input of ['0.001', 'Infinity', '-1', '1e2', '1,2,3', '10000000000']) expect(() => positiveMoney(input)).toThrow();
  expect(() => positiveMoney(0)).toThrow();
});
test('legacy contribution history reconciles without losing initial savings', () => {
  const goal = { id: 'g', name: 'Goal', target: 200, saved: 100, activity: [{ id: 'a', amount: 20, note: '', date: '2026-10-01' }] };
  expect(openingBalance(goal)).toBe(80);
  const next = contribute(goal, { id: 'b', amount: -30.01, note: '', date: '2026-10-02' });
  expect(next.saved).toBe(69.99);
  expect(sumMoney([next.startingBalance!, ...next.activity.map((a) => a.amount)])).toBe(next.saved);
  expect(() => contribute(next, { id: 'c', amount: -70, note: '', date: '2026-10-02' })).toThrow('Withdrawal exceeds');
});
test('payments are idempotent and preserve previous months', () => {
  const bill = { id: 'b', title: 'Rent', amount: 300, category: 'housing', dueDay: 31, paidMonth: null };
  const september = recordBillPayment(bill, '2026-09', '2026-09-30');
  const october = recordBillPayment(september, '2026-10', '2026-10-31');
  expect(recordBillPayment(october, '2026-10', 'duplicate')).toBe(october);
  expect(Object.keys(clearBillPayment(october, '2026-10').paymentHistory!)).toEqual(['2026-09']);
});
