import AsyncStorage from '@react-native-async-storage/async-storage';
import { object } from './decoders';

export const scopePrefix = (scope: string) => `@pocketwise/v2/${scope}/`;

// V1 has no verifiable owner. Leave it intact for recovery; never read it into
// an account or demo. V2 is per-record, so a single edit serializes one row.
export async function readDemoCache<T>(scope: string, feature: string, fallback: T, decode: (value: unknown) => T): Promise<T> {
  const value = await AsyncStorage.getItem(`${scopePrefix(scope)}${feature}/snapshot`);
  return value ? decode(JSON.parse(value)) : fallback;
}

export async function writeCache(scope: string, feature: string, before: unknown, after: unknown) {
  const prefix = `${scopePrefix(scope)}${feature}/`;
  if (scope === 'demo') {
    await AsyncStorage.setItem(`${prefix}snapshot`, JSON.stringify(after));
    return;
  }
  const collect = (value: unknown): Record<string, Record<string, unknown>[]> => {
    const record = value === null ? {} : Array.isArray(value) ? { rows: value } : object(value);
    const result: Record<string, Record<string, unknown>[]> = {};
    for (const name of Array.isArray(value) ? ['rows'] : ['transactions', 'bills']) {
      const rows = record[name] ?? [];
      if (!Array.isArray(rows)) throw new Error('Invalid cached collection.');
      result[name] = rows.map((row: unknown) => {
        const entry = object(row);
        if (typeof entry.id !== 'string') throw new Error('Invalid cached record ID.');
        return entry;
      });
    }
    return result;
  };
  const collections = collect(after);
  const previous = collect(before);
  const writes: [string, string][] = [], removals: string[] = [];
  for (const [name, rows] of Object.entries(collections)) {
    const old = new Map((previous[name] || []).map((row) => [row.id, row]));
    const next = new Set(rows.map((row) => row.id));
    for (const row of rows) {
      if (old.get(row.id) !== row) writes.push([`${prefix}${name}/${row.id}`, JSON.stringify(row)]);
    }
    for (const id of old.keys()) if (!next.has(id)) removals.push(`${prefix}${name}/${id}`);
  }
  if (!Array.isArray(after)) {
    const { transactions, bills, ...metadata } = object(after);
    writes.push([`${prefix}metadata`, JSON.stringify(metadata)]);
  }
  if (before === null) {
    const keys = await AsyncStorage.getAllKeys();
    const keep = new Set(writes.map(([key]) => key));
    removals.push(...keys.filter((key) => key.startsWith(prefix) && !keep.has(key)));
  }
  if (writes.length) await AsyncStorage.multiSet(writes);
  if (removals.length) await AsyncStorage.multiRemove(removals);
}

export async function clearScopeCache(scope: string) {
  const keys = await AsyncStorage.getAllKeys();
  const owned = keys.filter((key) => key.startsWith(scopePrefix(scope)));
  if (owned.length) await AsyncStorage.multiRemove(owned);
}
