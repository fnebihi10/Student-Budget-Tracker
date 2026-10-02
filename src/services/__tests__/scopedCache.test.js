import AsyncStorage from '@react-native-async-storage/async-storage';
import { writeCache, readDemoCache, clearScopeCache } from '../scopedCache';

jest.mock('@react-native-async-storage/async-storage', () => {
  const data = new Map();
  return {
    getItem: jest.fn(async (key) => data.get(key) || null),
    setItem: jest.fn(async (key, value) => { data.set(key, value); }),
    multiSet: jest.fn(async (pairs) => { for (const [key, value] of pairs) data.set(key, value); }),
    multiRemove: jest.fn(async (keys) => { for (const key of keys) data.delete(key); }),
    getAllKeys: jest.fn(async () => [...data.keys()]),
  };
});

test('legacy data is preserved but never assigned to demo or a verified account', async () => {
  await AsyncStorage.setItem('@pocketwise/v1', JSON.stringify({ transactions: ['legacy private'] }));
  await writeCache('user/A', 'goals', null, [{ id: 'a', saved: 100 }]);
  await writeCache('user/B', 'goals', null, [{ id: 'b', saved: 200 }]);
  expect(await readDemoCache('demo', 'goals', ['sample'])).toEqual(['sample']);
  await clearScopeCache('user/A');
  expect(await AsyncStorage.getItem('@pocketwise/v2/user/B/goals/rows/b')).toContain('200');
  expect(await AsyncStorage.getItem('@pocketwise/v1')).toContain('legacy private');
});

test('one change serializes only the changed record; deletion removes its cache', async () => {
  const old = Array.from({ length: 10000 }, (_, id) => ({ id: String(id), amount: 1 }));
  const next = [...old]; next[5] = { ...old[5], amount: 2 };
  AsyncStorage.multiSet.mockClear();
  await writeCache('user/perf', 'transactions', old, next);
  expect(AsyncStorage.multiSet.mock.calls[0][0]).toHaveLength(1);
  await writeCache('user/perf', 'transactions', next, next.filter((row) => row.id !== '5'));
  expect(await AsyncStorage.getItem('@pocketwise/v2/user/perf/transactions/rows/5')).toBeNull();
});
