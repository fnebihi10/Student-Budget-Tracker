export type Frequency = 'weekly' | 'monthly' | 'yearly';
export type Recurrence = { nextBillingDate: string; frequency: Frequency };

// Civil ledger dates use UTC calendar fields, never elapsed milliseconds for
// months/years. New date inputs are encoded at UTC noon. Original timestamps
// remain unchanged; their UTC civil day is the documented legacy interpretation.
export const civilDay = (value: string | Date): Date => {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) throw new Error('Invalid calendar date.');
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
};
export const monthStart = (value: Date, offset = 0): Date => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + offset, 1, 12));
export const monthDays = (year: number, month: number): number => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
export function occurrence(item: Recurrence, index: number): Date {
  const anchor = civilDay(item.nextBillingDate);
  if (item.frequency === 'weekly') {
    anchor.setUTCDate(anchor.getUTCDate() + index * 7);
    return anchor;
  }
  const year = anchor.getUTCFullYear() + (item.frequency === 'yearly' ? index : 0);
  const month = anchor.getUTCMonth() + (item.frequency === 'monthly' ? index : 0);
  const first = new Date(Date.UTC(year, month, 1, 12));
  first.setUTCDate(Math.min(anchor.getUTCDate(), monthDays(first.getUTCFullYear(), first.getUTCMonth())));
  return first;
}
export function nextRenewal(item: Recurrence, from = new Date()): Date {
  const start = civilDay(from), anchor = civilDay(item.nextBillingDate);
  let index = item.frequency === 'weekly' ? Math.max(0, Math.floor((start.getTime() - anchor.getTime()) / (7 * 86400000)))
    : item.frequency === 'yearly' ? Math.max(0, start.getUTCFullYear() - anchor.getUTCFullYear())
    : Math.max(0, (start.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + start.getUTCMonth() - anchor.getUTCMonth());
  let date = occurrence(item, index);
  if (date < start) date = occurrence(item, ++index);
  return date;
}
export function renewalsBetween(item: Recurrence, start: Date, endExclusive: Date): Date[] {
  const dates: Date[] = [];
  let next = nextRenewal(item, start);
  // Recompute from the original anchor each time: Feb 28 cannot replace Feb 29
  // or Jan 31 as the intended renewal day.
  while (next < endExclusive) {
    dates.push(next);
    const after = new Date(next); after.setUTCDate(after.getUTCDate() + 1);
    next = nextRenewal(item, after);
    if (dates.length > 10000) throw new Error('Projection range is too large.');
  }
  return dates;
}
