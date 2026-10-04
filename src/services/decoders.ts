import { Ionicons } from '@expo/vector-icons';
import type { Payment } from '../domain/finance';
import type { IconName, PeriodPlan } from '../domain/models';
import { parseMinor, assertDate, decodeActivities, positiveMoney } from '../domain/finance';
import { rowContracts, type Database, type RowOf, type Json } from './database';

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid record.');
  return value as Record<string, unknown>;
}
export function jsonValue(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map((entry: unknown) => jsonValue(entry));
  const result: Record<string, Json> = {};
  for (const [key, field] of Object.entries(object(value))) if (field !== undefined) result[key] = jsonValue(field);
  return result;
}
export function databaseRow<T extends keyof Database['public']['Tables']>(table: T, value: unknown): RowOf<T> {
  const record = object(value);
  for (const [key, contract] of Object.entries(rowContracts[table])) {
    const field = record[key];
    if (field === null && contract.nullable) continue;
    if (contract.type === 'json') { jsonValue(field); continue; }
    if (typeof field !== contract.type || (typeof field === 'number' && !Number.isFinite(field))) throw new Error(`Invalid ${table}.${key}`);
    if ('values' in contract && !contract.values.some((entry: string) => entry === field)) throw new Error(`Invalid ${table}.${key}`);
  }
  // Required fields, nullability, scalar types, and CHECK enums came from the
  // same migrated catalog as RowOf<T>. Nested finance JSON is decoded separately.
  return record as RowOf<T>;
}
export function moneyMap(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, amount] of Object.entries(object(value))) result[key] = parseMinor(amount) / 100;
  return result;
}
export function periodPlans(value: unknown): Record<string, PeriodPlan> {
  const result: Record<string, PeriodPlan> = {};
  for (const [key, entry] of Object.entries(object(value))) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) throw new Error('Invalid budget period.');
    const plan = object(entry);
    result[key] = { monthlyBudget: parseMinor(plan.monthlyBudget) / 100, categoryBudgets: moneyMap(plan.categoryBudgets) };
  }
  return result;
}
export const activities = decodeActivities;
export function payments(value: unknown): Record<string, Payment> {
  const result: Record<string, Payment> = {};
  for (const [key, entry] of Object.entries(object(value))) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key)) throw new Error('Invalid payment month.');
    const row = object(entry);
    if (row.paidAt !== null) assertDate(row.paidAt);
    if (row.operationId !== undefined && typeof row.operationId !== 'string') throw new Error('Invalid operation ID.');
    if (row.transactionId !== undefined && row.transactionId !== null && typeof row.transactionId !== 'string') throw new Error('Invalid transaction ID.');
    result[key] = { paidAt: row.paidAt, ...(row.amount !== undefined ? { amount: parseMinor(row.amount) / 100 } : {}), ...(row.source === 'legacy' ? { source: 'legacy' } : {}),
      ...(row.operationId !== undefined ? { operationId: row.operationId } : {}), ...(row.transactionId !== undefined ? { transactionId: row.transactionId } : {}) };
  }
  return result;
}
export function icon(value: unknown): IconName | undefined {
  return typeof value === 'string' && value in Ionicons.glyphMap ? value as IconName : undefined;
}

/** Validate the persisted demo's required shape before it enters React state.
 * Optional extensions are retained; authenticated data never loads this cache.
 */
export function demoShape<T>(value: unknown, example: T): T {
  const check = (entry: unknown, sample: unknown): void => {
    if (sample === null) {
      if (entry !== null && typeof entry !== 'string') throw new Error('Invalid demo value.');
    } else if (Array.isArray(sample)) {
      if (!Array.isArray(entry)) throw new Error('Invalid demo collection.');
      if (sample.length) for (const row of entry) {
        const valid = sample.some((candidate: unknown) => { try { check(row, candidate); return true; } catch { return false; } });
        if (!valid) throw new Error('Invalid demo record.');
      }
    } else if (typeof sample === 'object') {
      const record = object(entry);
      for (const [key, field] of Object.entries(object(sample))) check(record[key], field);
      if ('periodBudgets' in record) periodPlans(record.periodBudgets);
      if ('categoryBudgets' in record) moneyMap(record.categoryBudgets);
      if ('paymentHistory' in record) payments(record.paymentHistory);
      if ('activity' in record) activities(record.activity);
      if ('target' in record) positiveMoney(record.target);
      if ('saved' in record) parseMinor(record.saved);
      const choices: Record<string, readonly string[]> = { type: ['income', 'expense'], frequency: ['weekly', 'monthly', 'yearly'], direction: ['i_owe', 'owed_to_me'], currency: ['EUR', 'USD', 'GBP', 'HUF'] };
      for (const [key, values] of Object.entries(choices)) if (key in record && !values.includes(String(record[key]))) throw new Error('Invalid demo enum.');
    } else if (typeof entry !== typeof sample || (typeof entry === 'number' && !Number.isFinite(entry))) {
      throw new Error('Invalid demo field.');
    }
  };
  check(value, example);
  // The recursive check establishes the required shape represented by T.
  return value as T;
}
