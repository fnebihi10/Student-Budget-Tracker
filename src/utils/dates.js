export const isValidDateInput = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const dateInputToIso = (value) => {
  if (!isValidDateInput(value)) return null;
  return new Date(`${value}T12:00:00`).toISOString();
};

export const monthKey = (date = new Date()) => {
  const value = new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
};

export const isBillPaidForMonth = (bill, date = new Date()) => bill.paidMonth === monthKey(date);

export const daysInMonth = (year, monthIndex) =>
  new Date(year, monthIndex + 1, 0).getDate();

export const sameDayInMonth = (value, year, monthIndex) => {
  const source = new Date(value);
  if (Number.isNaN(source.getTime())) return null;
  const date = new Date(
    year,
    monthIndex,
    Math.min(source.getDate(), daysInMonth(year, monthIndex)),
    12
  );
  return date.toISOString();
};
