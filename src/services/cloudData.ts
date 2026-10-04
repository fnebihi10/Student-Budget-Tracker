import type { User } from '@supabase/supabase-js';
import type { RowOf, Database } from './database';
import type { BudgetState, Subscription, SavingsGoal, Split } from '../domain/models';
import type { Transaction, Bill } from '../domain/finance';
import { activities, payments, icon, object, databaseRow, jsonValue } from './decoders';
import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";
import { openingBalance, validateFinancialRow, positiveMoney, assertText } from '../domain/finance';
type FinancialTable = 'transactions' | 'bills' | 'subscriptions' | 'goals' | 'splits';

const collection = (table: FinancialTable) => supabase.from(table);

export const newId = () => Crypto.randomUUID();

export async function persistBillPayment(before: BudgetState, after: BudgetState, request: {
  operationId: string; billId: string; period: string; recordTransaction: boolean; paidAt: string;
}): Promise<void> {
  const original = before.bills.find((bill) => bill.id === request.billId);
  if (!original) throw new Error('Bill deleted. Reload before recording payment.');
  const { data, error } = await supabase.rpc('record_bill_payment', {
    operation_id: request.operationId, bill_id: request.billId, period: request.period,
    expected_revision: original.revision ?? 0, record_transaction: request.recordTransaction, paid_at: request.paidAt,
  });
  if (error) throw error;
  const receipt = object(data);
  const bill = databaseRow("bills", receipt.bill);
  validateFinancialRow('bills', bill);
  if (bill.id !== request.billId || typeof bill.revision !== 'number') throw new Error('Invalid payment receipt. Reload before retrying.');
  after.bills = after.bills.map((item) => item.id === request.billId ? billFromRow(bill) : item);
  // A different-device occurrence receipt may refer to a different operation
  // UUID. Never publish the synthetic expense made by the local recipe as well.
  after.transactions = before.transactions;
  if (receipt.transaction !== null) {
    const transaction = databaseRow("transactions", receipt.transaction);
    validateFinancialRow('transactions', transaction);
    if (typeof transaction.id !== 'string') throw new Error('Invalid transaction receipt.');
    const item = transactionFromRow(transaction);
    after.transactions = [item, ...after.transactions.filter((row) => row.id !== item.id)];
  }
}

const ensure = ({ error }: { error: unknown }) => {
  if (error) throw error;
};

export async function fetchRows<T extends FinancialTable>(table: T, userId: string): Promise<RowOf<T>[]> {
  const rows: RowOf<T>[] = [];
  const pageSize = 500;
  let cursor: string | null = null;
  for (;;) {
    let query = collection(table).select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(pageSize);
    if (cursor) query = query.lt('id', cursor);
    const result = await query;
    ensure(result);
    const page = (result.data || []).map((row) => databaseRow(table, row));
    for (const row of page) validateFinancialRow(table, row);
    rows.push(...page);
    if ((result.data || []).length < pageSize) return rows;
    cursor = page[page.length - 1].id;
  }
}

export async function deleteRow(table: FinancialTable, userId: string, id: string, revision: number) {
  ensure(
    await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .eq('revision', revision).select('id').single()
  );
}

// Inserts are idempotent by stable UUID. Edits are UPDATE only: they cannot
// recreate a row deleted by another device. No snapshot-wide upserts.
export async function persistCollection<T extends FinancialTable, M extends { id: string; revision?: number }>(table: T, userId: string, before: M[], after: M[], toRow: (row: M) => Omit<Database['public']['Tables'][T]['Insert'], 'user_id'>) {
  const old = new Map(before.map((row) => [row.id, row]));
  const next = new Set(after.map((row) => row.id));
  for (const row of after) {
    if (old.get(row.id) === row) continue;
    const previous = old.get(row.id);
    // The mapper is tied to T; erasing that parameter here avoids PostgREST's
    // unresolved conditional type while retaining the per-table call contract.
    const value = { ...toRow(row), user_id: userId } as Database['public']['Tables'][FinancialTable]['Insert'];
    validateFinancialRow(table, value);
    if (!old.has(row.id)) {
      ensure(await collection(table).upsert<Database["public"]["Tables"][FinancialTable]["Insert"]>(value, { onConflict: 'id', ignoreDuplicates: true }));
    } else {
      const result = await collection(table).update({ ...value, revision: (previous?.revision || 0) + 1 })
        .eq('user_id', userId).eq('id', row.id)
        .eq('revision', previous?.revision || 0).select('revision').single();
      ensure(result);
      if (!result.data || !("revision" in result.data)) throw new Error("Revision conflict or record deleted. Reload before saving again.");
      row.revision = result.data.revision;
    }
  }
  for (const [id, row] of old) if (!next.has(id)) await deleteRow(table, userId, id, row.revision ?? 0);
}

export const transactionToRow = (item: Transaction) => ({
  id: item.id, type: item.type, amount: item.amount, category: item.category,
  title: item.title, note: item.note || '', transaction_date: item.date,
  recurring: Boolean(item.recurring),
});
export const billToRow = (bill: Bill) => ({
  id: bill.id, title: bill.title, amount: bill.amount, category: bill.category,
  due_day: bill.dueDay, paid_month: bill.paidMonth,
  payment_history: jsonValue(bill.paymentHistory || {}),
});

export async function persistBudgetChanges(userId: string, before: BudgetState, after: BudgetState) {
  if (before.profile !== after.profile) {
    assertText(after.profile.name, 80, 'Name');
    if ((after.profile.school || '').length > 160) throw new Error('School must be at most 160 characters.');
    const result = await supabase.from('profiles').update({ name: after.profile.name, school: after.profile.school, revision: (before.profile.revision || 0) + 1 }).eq('id', userId)
      .eq('revision', before.profile.revision || 0).select('revision').single();
    ensure(result);
    if (!result.data) throw new Error("Profile changed. Reload before saving again.");
    after.profile.revision = result.data.revision;
  }
  if (before.settings !== after.settings || before.categoryBudgets !== after.categoryBudgets || before.periodBudgets !== after.periodBudgets) {
    positiveMoney(after.settings.monthlyBudget);
    if (!['EUR', 'USD', 'GBP', 'HUF'].includes(after.settings.currency)) throw new Error('Invalid currency.');
    const result = await supabase.from('user_settings').update({
      currency: after.settings.currency, monthly_budget: after.settings.monthlyBudget,
      notifications: after.settings.notifications, category_budgets: after.categoryBudgets,
      period_budgets: after.periodBudgets,
      revision: (before.settings.revision || 0) + 1,
    }).eq('user_id', userId).eq('revision', before.settings.revision || 0).select('revision').single();
    ensure(result);
    // category-only changes also receive a new settings version.
    if (!result.data) throw new Error("Settings changed. Reload before saving again.");
    after.settings = { ...after.settings, revision: result.data.revision };
  }
  if (before.transactions !== after.transactions) await persistCollection('transactions', userId, before.transactions, after.transactions, transactionToRow);
  if (before.bills !== after.bills) await persistCollection('bills', userId, before.bills, after.bills, billToRow);
}

export async function deleteOwnAccount() {
  ensure(await supabase.rpc("delete_own_account"));
  await supabase.auth.signOut({ scope: "local" });
}

export async function fetchBudgetData(user: User) {
  const [profileResult, settingsResult, transactions, bills] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    fetchRows("transactions", user.id),
    fetchRows("bills", user.id),
  ]);
  ensure(profileResult);
  ensure(settingsResult);
  return {
    profile: profileResult.data ? databaseRow("profiles", profileResult.data) : null,
    settings: settingsResult.data ? databaseRow("user_settings", settingsResult.data) : null,
    transactions,
    bills,
  };
}

export const transactionFromRow = (row: RowOf<'transactions'>): Transaction => ({
  revision: row.revision || 0,
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  category: row.category,
  title: row.title,
  note: row.note,
  date: row.transaction_date,
  recurring: row.recurring,
});

export const billFromRow = (row: RowOf<'bills'>): Bill => ({
  revision: row.revision || 0,
  paymentHistory: payments(row.payment_history || {}),
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  category: row.category,
  dueDay: row.due_day,
  paidMonth: row.paid_month,
});

export const subscriptionToRow = (item: Subscription) => ({
  id: item.id,
  service_id: item.serviceId,
  name: item.name,
  amount: item.amount,
  frequency: item.frequency,
  next_billing_date: item.nextBillingDate,
  category: item.category,
  reminder_days: item.reminderDays,
  notes: item.notes || "",
  free_trial: Boolean(item.freeTrial),
  icon: item.icon,
  color: item.color,
  status: item.status,
  created_at: item.createdAt,
});

export const subscriptionFromRow = (row: RowOf<'subscriptions'>): Subscription => ({
  revision: row.revision || 0,
  id: row.id,
  serviceId: row.service_id,
  name: row.name,
  amount: Number(row.amount),
  frequency: row.frequency,
  nextBillingDate: row.next_billing_date,
  category: row.category,
  reminderDays: row.reminder_days,
  notes: row.notes,
  freeTrial: row.free_trial,
  icon: icon(row.icon),
  color: row.color,
  status: row.status,
  createdAt: row.created_at,
});

export const goalToRow = (goal: SavingsGoal) => ({
  starting_balance: openingBalance(goal),
  id: goal.id,
  template_id: goal.templateId,
  name: goal.name,
  target: goal.target,
  saved: goal.saved,
  deadline: goal.deadline,
  icon: goal.icon,
  color: goal.color,
  notes: goal.notes || "",
  activity: jsonValue(goal.activity || []),
  created_at: goal.createdAt,
});

export const goalFromRow = (row: RowOf<'goals'>): SavingsGoal => ({
  revision: row.revision || 0,
  startingBalance: row.starting_balance == null ? undefined : Number(row.starting_balance),
  id: row.id,
  templateId: row.template_id,
  name: row.name,
  target: Number(row.target),
  saved: Number(row.saved),
  deadline: row.deadline,
  icon: icon(row.icon),
  color: row.color,
  notes: row.notes,
  activity: activities(row.activity || []),
  createdAt: row.created_at,
});

export const splitToRow = (item: Split) => ({
  id: item.id,
  title: item.title,
  person: item.person,
  amount: item.amount,
  direction: item.direction,
  category: item.category,
  due_date: item.dueDate,
  note: item.note || "",
  status: item.status,
  settled_at: item.settledAt,
  created_at: item.createdAt,
});

export const splitFromRow = (row: RowOf<'splits'>): Split => ({
  revision: row.revision || 0,
  id: row.id,
  title: row.title,
  person: row.person,
  amount: Number(row.amount),
  direction: row.direction,
  category: row.category,
  dueDate: row.due_date,
  note: row.note,
  status: row.status,
  settledAt: row.settled_at,
  createdAt: row.created_at,
});
