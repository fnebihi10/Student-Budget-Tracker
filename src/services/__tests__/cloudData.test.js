import { fetchRows, persistCollection, transactionToRow } from '../cloudData';
import { supabase } from '../../lib/supabase';

jest.mock('../../lib/supabase', () => ({ supabase: { from: jest.fn() } }));
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

test('reads all pages beyond Supabase default cap using deterministic ordering', async () => {
  const queries = [builder({ data: Array(500).fill({ id: 'first' }) }), builder({ data: Array(500).fill({ id: 'second' }) }), builder({ data: [{ id: 'last' }] })];
  for (const query of queries) supabase.from.mockReturnValueOnce(query);
  const rows = await fetchRows('transactions', 'A', 'transaction_date');
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
  expect(query.upsert).not.toHaveBeenCalled();
});
