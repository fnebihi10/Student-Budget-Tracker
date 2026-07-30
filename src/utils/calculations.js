import { isSameMonth } from "./formatters";

export const monthTransactions = (transactions, date = new Date()) =>
  transactions.filter((item) => isSameMonth(item.date, date));

export const getTotals = (transactions, date = new Date()) => {
  const current = monthTransactions(transactions, date);
  const income = current
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = current
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);
  return { income, expenses, balance: income - expenses };
};

export const categorySpend = (transactions, date = new Date()) =>
  monthTransactions(transactions, date)
    .filter((item) => item.type === "expense")
    .reduce((result, item) => {
      result[item.category] = (result[item.category] || 0) + Number(item.amount);
      return result;
    }, {});

export const safePercent = (value, total) =>
  total > 0 ? Math.min((Number(value) / Number(total)) * 100, 100) : 0;
