import { fetchRows, persistCollection, transactionToRow, persistBillPayment } from '../cloudData';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn(), rpc: jest.fn() } }));
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }));

const builder = (result) => {
  const query = {};
  for (const method of ['select', 'eq', 'order', 'update', 'delete', 'upsert', 'limit', 'lt']) query[method] = jest.fn(() => query);
  query.range = jest.fn(async () => result);
  query.single = jest.fn(async () => result);
  query.then = (resolve) => Promise.resolve(result).then(resolve);
  return query;
};
beforeEach(() => supabase.from.mockReset());

test('another device payment receipt does not publish the local synthetic expense', async () => {
  const transaction = { id: 'remote-operation', user_id: 'A', revision: 1, type: 'expense', amount: 18, category: 'other', title: 'Phone', note: '', recurring: false, transaction_date: '2026-10-02', created_at: '2026-10-02' };
  const bill = { id: 'bill', user_id: 'A', revision: 1, title: 'Phone', amount: 18, category: 'other', due_day: 2, paid_month: '2026-10', payment_history: {}, created_at: '2026-10-02' };
  supabase.rpc.mockResolvedValue({ data: { bill, transaction }, error: null });
  const before = { bills: [{ id: 'bill', revision: 0 }], transactions: [{ id: transaction.id, title: 'Phone' }] };
  const after = { bills: [...before.bills], transactions: [{ id: 'local-operation' }, ...before.transactions] };
  await persistBillPayment(before, after, { operationId: 'local-operation', billId: 'bill', period: '2026-10', recordTransaction: true, paidAt: '2026-10-02' });
  expect(after.transactions).toHaveLength(1);
  expect(after.transactions[0].id).toBe('remote-operation');
  expect(after.bills[0].revision).toBe(1);
});

test('reads all pages beyond Supabase default cap using deterministic ordering', async () => {
  const row = (id) => ({ id, user_id: 'A', revision: 0, type: 'expense', amount: 1, category: 'food', title: 'Lunch', note: '', recurring: false, transaction_date: '2026-10-02', created_at: '2026-10-02' });
  const queries = [builder({ data: Array(500).fill(row('first')) }), builder({ data: Array(500).fill(row('second')) }), builder({ data: [row('last')] })];
  for (const query of queries) supabase.from.mockReturnValueOnce(query);
  const rows = await fetchRows('transactions', 'A');
  expect(rows).toHaveLength(1001);
  expect(queries[2].lt).toHaveBeenCalledWith('id', 'second');
  expect(queries[2].limit).toHaveBeenCalledWith(500);
  for (const query of queries) expect(query.eq).toHaveBeenCalledWith('user_id', 'A');
});

test('only one edited row is sent out of 10000 and revision is checked', async () => {
  const before = Array.from({ length: 10000 }, (_, id) => ({ id: String(id), revision: 2, type: 'expense', amount: 1, category: 'food', title: 'Lunch', date: '2026-10-02' }));
  const after = [...before]; after[99] = { ...before[99], amount: 2 };
  const query = builder({ data: { revision: 3 } }); supabase.from.mockReturnValue(query);
  await persistCollection('transactions', 'A', before, after, transactionToRow);
  expect(supabase.from).toHaveBeenCalledTimes(1);
  expect(query.update).toHaveBeenCalledWith(expect.objectContaining({ id: '99', user_id: 'A', amount: 2 }));
  expect(query.eq).toHaveBeenCalledWith('revision', 2);
  expect(query.upsert).not.toHaveBeenCalled();
  expect(after[99].revision).toBe(3);
});

test('stale update of deleted/concurrently changed record fails without recreating it', async () => {
  const old = { id: 't', type: 'expense', amount: 1, title: 'Lunch', category: 'food', date: '2026-10-02' };
  const query = builder({ error: new Error('No row matches version') }); supabase.from.mockReturnValue(query);
  await expect(persistCollection('transactions', 'A', [old], [{ ...old, amount: 2 }], transactionToRow)).rejects.toThrow();
  expect(query.upsert).not.toHaveBeenCalled();
});

test('delete sends only an owner-scoped delete and never writes a stale collection', async () => {
  const query = builder({ data: null, error: null }); supabase.from.mockReturnValue(query);
  await persistCollection('goals', 'A', [{ id: 'gone' }], []);
  expect(query.delete).toHaveBeenCalledTimes(1);
  expect(query.eq).toHaveBeenCalledWith('user_id', 'A');
  expect(query.eq).toHaveBeenCalledWith('id', 'gone');
  expect(query.eq).toHaveBeenCalledWith('revision', 0);
  expect(query.upsert).not.toHaveBeenCalled();
});
