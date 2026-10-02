import AsyncStorage from '@react-native-async-storage/async-storage';

export const scopePrefix = (scope) => `@pocketwise/v2/${scope}/`;

// V1 has no verifiable owner. Leave it intact for recovery; never read it into
// an account or demo. V2 is per-record, so a single edit serializes one row.
export async function readDemoCache(scope, feature, fallback) {
  const value = await AsyncStorage.getItem(`${scopePrefix(scope)}${feature}/snapshot`);
  return value ? JSON.parse(value) : fallback;
}

export async function writeCache(scope, feature, before, after) {
  const prefix = `${scopePrefix(scope)}${feature}/`;
  if (scope === 'demo') {
    await AsyncStorage.setItem(`${prefix}snapshot`, JSON.stringify(after));
    return;
  }
  const collections = Array.isArray(after) ? { rows: after } : {
    transactions: after.transactions, bills: after.bills,
  };
  const previous = Array.isArray(before) ? { rows: before } : {
    transactions: before?.transactions || [], bills: before?.bills || [],
  };
  const writes = [], removals = [];
  for (const [name, rows] of Object.entries(collections)) {
    const old = new Map((previous[name] || []).map((row) => [row.id, row]));
    const next = new Set(rows.map((row) => row.id));
    for (const row of rows) {
      if (old.get(row.id) !== row) writes.push([`${prefix}${name}/${row.id}`, JSON.stringify(row)]);
    }
    for (const id of old.keys()) if (!next.has(id)) removals.push(`${prefix}${name}/${id}`);
  }
  if (!Array.isArray(after)) {
    const { transactions, bills, ...metadata } = after;
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

export async function clearScopeCache(scope) {
  const keys = await AsyncStorage.getAllKeys();
  const owned = keys.filter((key) => key.startsWith(scopePrefix(scope)));
  if (owned.length) await AsyncStorage.multiRemove(owned);
}
