import { afterEach, expect, jest, test } from '@jest/globals';
import { ConfirmedStore, invalidateFinanceStores } from '../confirmedStore';

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const create = (load = async () => ['A'], demo = false) => {
  const persist = jest.fn(async () => {});
  const cache = jest.fn(async () => {});
  return { store: new ConfirmedStore({ initial: [] as string[], load, persist, cache, demo }), persist, cache };
};
afterEach(async () => { await invalidateFinanceStores(); });

test('late A load cannot populate B or demo after logout', async () => {
  const request = deferred<string[]>();
  const a = create(() => request.promise);
  const loading = a.store.load();
  await invalidateFinanceStores();
  const b = create(async () => ['B']);
  const demo = create(async () => ['demo'], true);
  await b.store.load(); await demo.store.load();
  request.resolve(['private A']); await loading;
  expect(a.store.getSnapshot().data).toEqual([]);
  expect(a.cache).not.toHaveBeenCalled();
  expect(b.store.getSnapshot().data).toEqual(['B']);
  expect(demo.store.getSnapshot().data).toEqual(['demo']);
});

test('initial load failure blocks offline editing and can be retried', async () => {
  const load = jest.fn<() => Promise<string[]>>().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(['cloud']);
  const { store, persist } = create(load);
  await store.load();
  expect(store.getSnapshot().status).toBe('failed');
  expect(await store.mutate(() => ['offline'])).toBe(false);
  expect(persist).not.toHaveBeenCalled();
  await store.load();
  expect(store.getSnapshot().verified).toBe(true);
  expect(await store.mutate(() => ['edit'])).toBe(true);
});

test('pending save retains confirmed state and suppresses duplicate submissions', async () => {
  const { store, persist } = create(); await store.load();
  const request = deferred<void>(); persist.mockImplementation(() => request.promise);
  const mutation = store.mutate(() => ['new']);
  expect(store.getSnapshot().status).toBe('pending');
  expect(store.getSnapshot().data).toEqual(['A']);
  expect(await store.mutate(() => ['duplicate'])).toBe(false);
  request.resolve(); expect(await mutation).toBe(true);
  expect(persist).toHaveBeenCalledTimes(1);
  expect(store.getSnapshot().data).toEqual(['new']);
});

test('failed deletion retains the record; ambiguous outcome requires reconciliation', async () => {
  const { store, persist } = create(); await store.load();
  persist.mockRejectedValueOnce(new Error('response lost'));
  expect(await store.mutate(() => [])).toBe(false);
  expect(store.getSnapshot().data).toEqual(['A']);
  expect(store.getSnapshot().verified).toBe(false);
  expect(await store.mutate(() => [])).toBe(false);
  await store.load();
  expect(await store.mutate(() => [])).toBe(true);
});

test('interrupted write never restores state/cache after account invalidation', async () => {
  const { store, persist, cache } = create(); await store.load();
  await Promise.resolve(); cache.mockClear();
  const request = deferred<void>(); persist.mockImplementation(() => request.promise);
  const mutation = store.mutate(() => ['private']);
  await invalidateFinanceStores(); request.resolve();
  expect(await mutation).toBe(false);
  expect(store.getSnapshot().data).toEqual(['A']);
  expect(cache).not.toHaveBeenCalled();
});

test('invalid domain recipe is rejected before any write', async () => {
  const { store, persist } = create(); await store.load();
  expect(await store.mutate(() => { throw new Error('Withdrawal exceeds savings'); })).toBe(false);
  expect(store.getSnapshot().error).toBe('Withdrawal exceeds savings');
  expect(persist).not.toHaveBeenCalled();
});

test('StrictMode cleanup/setup restores a store without accepting an older request', async () => {
  const request = deferred<string[]>();
  const load = jest.fn<() => Promise<string[]>>().mockImplementationOnce(() => request.promise).mockResolvedValue(['fresh']);
  const { store } = create(load);
  const oldLoad=store.load(); store.invalidate(); store.activate();
  await store.load(); request.resolve(['old']); await oldLoad;
  expect(store.getSnapshot().data).toEqual(['fresh']);
});
