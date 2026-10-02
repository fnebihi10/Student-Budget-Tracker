import { expect, test } from '@jest/globals';
import { csvExport, jsonExport } from '../exports';
test('versioned JSON retains histories; CSV escapes delimiters, lines and formulas', () => {
  const data = { profile: {}, settings: { currency: 'EUR' }, categoryBudgets: {}, periodBudgets: {}, bills: [{ paymentHistory: { '2026-10': { paidAt: 'today' } } }], goals: [], subscriptions: [], splits: [], transactions: [{ id: 't', date: '2026-10-02', type: 'expense', amount: 0.1, category: 'food', title: '=HYPERLINK("malicious")', note: 'A,"B"\nC' }] };
  expect(JSON.parse(jsonExport(data)).schemaVersion).toBe(2);
  expect(JSON.parse(jsonExport(data)).bills[0].paymentHistory['2026-10']).toBeDefined();
  const csv = csvExport(data);
  expect(csv).toContain('"0.10","EUR"');
  expect(csv).toContain('"\'=HYPERLINK(""malicious"")"');
  expect(csv).toContain('"A,""B""\nC"');
});
