export type Currency = 'EUR' | 'USD' | 'GBP' | 'HUF';
export type Transaction = { id: string; revision?: number; type: 'income' | 'expense'; amount: number; category: string; title: string; note?: string; date: string; recurring?: boolean };
export type Payment = { paidAt: string | null; amount?: number; source?: 'legacy' };
export type Bill = { id: string; revision?: number; title: string; amount: number; category: string; dueDay: number; paidMonth: string | null; paymentHistory?: Record<string, Payment> };
export type Activity = { id: string; amount: number; note: string; date: string };
export type Goal = { id: string; revision?: number; name: string; target: number; saved: number; startingBalance?: number; activity: Activity[] };

/** All supported account currencies use a deliberate two-decimal ledger.
 * UI inputs reject excess precision. DB numeric(12,2) adapters retain historical
 * major-unit API values; calculations use safe integer hundredths internally.
 */
export function parseMinor(value: unknown, allowNegative = false): number {
  const text = String(value).trim().replace(',', '.');
  const pattern = allowNegative ? /^-?\d+(?:\.\d{1,2})?$/ : /^\d+(?:\.\d{1,2})?$/;
  if (!pattern.test(text)) throw new Error('Enter an amount with at most two decimal places.');
  const negative = text.startsWith('-');
  const [whole, fraction = ''] = text.replace('-', '').split('.');
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor > 999999999999) throw new Error('Amount is too large.');
  return negative ? -minor : minor;
}
export function positiveMoney(value: unknown): number {
  const minor = parseMinor(value);
  if (minor <= 0) throw new Error('Amount must be greater than zero.');
  return minor / 100;
}
export function validMoney(value: unknown, allowZero = false): boolean {
  try { const n = parseMinor(value); return allowZero ? n >= 0 : n > 0; } catch { return false; }
}
export function sumMoney(values: readonly number[]): number {
  const cents = values.reduce((sum, value) => sum + parseMinor(value, true), 0);
  if (!Number.isSafeInteger(cents)) throw new Error('Total is too large.');
  return cents / 100;
}
export function openingBalance(goal: Goal): number {
  return goal.startingBalance ?? sumMoney([goal.saved, -sumMoney(goal.activity.map((a) => a.amount))]);
}
export function contribute(goal: Goal, activity: Activity): Goal {
  const minor = parseMinor(activity.amount, true);
  if (!minor) throw new Error('Contribution cannot be zero.');
  const saved = sumMoney([goal.saved, activity.amount]);
  if (saved < 0) throw new Error('Withdrawal exceeds the saved balance.');
  return { ...goal, startingBalance: openingBalance(goal), saved, activity: [activity, ...goal.activity] };
}
export function recordBillPayment(bill: Bill, month: string, paidAt: string): Bill {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid payment month.');
  if (bill.paymentHistory?.[month] || bill.paidMonth === month) return bill;
  return { ...bill, paidMonth: month, paymentHistory: { ...bill.paymentHistory, [month]: { paidAt, amount: bill.amount } } };
}
export function clearBillPayment(bill: Bill, month: string): Bill {
  const history = { ...bill.paymentHistory };
  delete history[month];
  return { ...bill, paidMonth: bill.paidMonth === month ? null : bill.paidMonth, paymentHistory: history };
}
export function assertText(value: unknown, max: number, label: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} must contain 1–${max} characters.`);
}
export function assertDate(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) throw new Error('Enter a valid date.');
}

export function validateFinancialRow(table: string, row: Record<string, unknown>): void {
  if (table === 'goals') {
    positiveMoney(row.target);
    parseMinor(row.saved);
    assertText(row.name, 80, 'Name');
    if (row.deadline) assertDate(row.deadline);
    if (!Array.isArray(row.activity)) throw new Error('Invalid contribution history.');
    const activity = row.activity as Activity[];
    if (sumMoney([Number(row.starting_balance), ...activity.map((a) => a.amount)]) !== Number(row.saved)) throw new Error('Savings history does not reconcile.');
  } else {
    positiveMoney(row.amount);
    assertText(table === 'subscriptions' ? row.name : row.title, 80, 'Title');
    assertText(row.category, 40, 'Category');
  }
  const note = row.note ?? row.notes ?? '';
  if (typeof note !== 'string' || note.length > 500) throw new Error('Notes must be at most 500 characters.');
  if (table === 'transactions') {
    if (!['income', 'expense'].includes(String(row.type))) throw new Error('Invalid transaction type.');
    assertDate(row.transaction_date);
  }
  if (table === 'bills' && (!Number.isInteger(row.due_day) || Number(row.due_day) < 1 || Number(row.due_day) > 31)) throw new Error('Due day must be 1–31.');
  if (table === 'subscriptions') {
    assertDate(row.next_billing_date);
    if (!['weekly', 'monthly', 'yearly'].includes(String(row.frequency))) throw new Error('Invalid frequency.');
    if (!['active', 'paused'].includes(String(row.status))) throw new Error('Invalid subscription status.');
    if (!Number.isInteger(row.reminder_days) || Number(row.reminder_days) < 0 || Number(row.reminder_days) > 30) throw new Error('Reminder days must be 0–30.');
  }
  if (table === 'splits') {
    assertText(row.person, 80, 'Person');
    if (!['i_owe', 'owed_to_me'].includes(String(row.direction))) throw new Error('Invalid debt direction.');
    if (!['open', 'settled'].includes(String(row.status))) throw new Error('Invalid debt status.');
    if (row.due_date) assertDate(row.due_date);
  }
}
