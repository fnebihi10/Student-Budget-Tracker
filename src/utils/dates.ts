import type { Bill } from '../domain/finance';
export const isValidDateInput = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const dateInputToIso = (value: string) => {
  if (!isValidDateInput(value)) return null;
  return new Date(`${value}T12:00:00Z`).toISOString();
};

export const monthKey = (date: string | Date = new Date()) => {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
};

export const isBillPaidForMonth = (bill: Pick<Bill, 'paidMonth' | 'paymentHistory'>, date = new Date()) => Boolean(bill.paymentHistory?.[monthKey(date)]) || bill.paidMonth === monthKey(date);

export const daysInMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const sameDayInMonth = (value: string, year: number, monthIndex: number) => {
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return null;
  const date = new Date(Date.UTC(
    year,
    monthIndex,
    Math.min(source.getUTCDate(), daysInMonth(year, monthIndex)),
    12
  ));
  return date.toISOString();
};
