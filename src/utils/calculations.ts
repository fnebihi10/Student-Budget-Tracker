import { isSameMonth } from "./formatters";
import { parseMinor } from '../domain/finance';
import type { Transaction } from '../domain/finance';

const finiteMinor = (value: unknown): number => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return parseMinor(amount, true);
};
const fromMinor = (value: number): number => {
  if (!Number.isSafeInteger(value)) throw new Error('Financial aggregate is too large.');
  return value / 100;
};

export const monthTransactions = (transactions: readonly Transaction[], date = new Date()) =>
  transactions.filter((item) => isSameMonth(item.date, date));

export const getTotals = (transactions: readonly Transaction[], date = new Date()) => {
  let income = 0, expenses = 0;
  for (const item of transactions) {
    if (!isSameMonth(item.date, date)) continue;
    if (item.type === 'income') income += finiteMinor(item.amount);
    if (item.type === 'expense') expenses += finiteMinor(item.amount);
  }
  return { income: fromMinor(income), expenses: fromMinor(expenses), balance: fromMinor(income - expenses) };
};

export const categorySpend = (transactions: readonly Transaction[], date = new Date()) => {
  const cents = monthTransactions(transactions, date)
    .filter((item) => item.type === "expense")
    .reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] || 0) + finiteMinor(item.amount);
      return result;
    }, {});
  return Object.fromEntries(Object.entries(cents).map(([key, value]) => [key, fromMinor(value)]));
};

export const safePercent = (value: number, total: number) =>
  total > 0 ? Math.min((Number(value) / Number(total)) * 100, 100) : 0;

export const totalCategoryBudget = (categoryBudgets: Record<string, number> = {}) =>
  fromMinor(Object.values(categoryBudgets).reduce((sum, value) => sum + finiteMinor(value), 0));
