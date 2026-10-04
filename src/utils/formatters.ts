const currencyLocales: Record<string, string> = {
  EUR: "en-IE",
  USD: "en-US",
  GBP: "en-GB",
  HUF: "hu-HU",
};

export const formatMoney = (value: number | string, currency = "EUR", compact = false) =>
  new Intl.NumberFormat(currencyLocales[currency] || "en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: compact ? 0 : 2,
    notation: compact ? "compact" : "standard",
  }).format(Number(value) || 0);

export const shortDate = (date: string | Date) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: 'UTC' }).format(new Date(date));

export const monthLabel = (date = new Date()) =>
  new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: 'UTC' }).format(date);

export const isSameMonth = (value: string | Date, compare = new Date()) => {
  const date = new Date(value);
  return date.getUTCMonth() === compare.getUTCMonth() && date.getUTCFullYear() === compare.getUTCFullYear();
};
