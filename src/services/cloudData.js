import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";
import { openingBalance, validateFinancialRow, positiveMoney, assertText } from '../domain/finance';

export const newId = () => Crypto.randomUUID();

const ensure = ({ error }) => {
  if (error) throw error;
};

export async function fetchRows(table, userId) {
  const rows = [];
  const pageSize = 500;
  let cursor = null;
  for (;;) {
    let query = supabase.from(table).select('*')
      .eq('user_id', userId)
      .order('id', { ascending: false })
      .limit(pageSize);
    if (cursor) query = query.lt('id', cursor);
    const result = await query;
    ensure(result);
    rows.push(...(result.data || []));
    if ((result.data || []).length < pageSize) return rows;
    cursor = result.data[result.data.length - 1].id;
  }
}

export async function deleteRow(table, userId, id) {
  ensure(
    await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
  );
}

// Inserts are idempotent by stable UUID. Edits are UPDATE only: they cannot
// recreate a row deleted by another device. No snapshot-wide upserts.
export async function persistCollection(table, userId, before, after, toRow = (row) => row) {
  const old = new Map(before.map((row) => [row.id, row]));
  const next = new Set(after.map((row) => row.id));
  for (const row of after) {
    if (old.get(row.id) === row) continue;
    const value = { ...toRow(row), user_id: userId };
    validateFinancialRow(table, value);
    if (!old.has(row.id)) {
      ensure(await supabase.from(table).upsert(value, { onConflict: 'id', ignoreDuplicates: true }));
    } else {
      const result = await supabase.from(table).update({ ...value, revision: (old.get(row.id).revision || 0) + 1 })
        .eq('user_id', userId).eq('id', row.id)
        .eq('revision', old.get(row.id).revision || 0).select('revision').single();
      ensure(result);
      row.revision = result.data.revision;
    }
  }
  for (const id of old.keys()) if (!next.has(id)) await deleteRow(table, userId, id);
}

export const transactionToRow = (item) => ({
  id: item.id, type: item.type, amount: item.amount, category: item.category,
  title: item.title, note: item.note || '', transaction_date: item.date,
  recurring: Boolean(item.recurring),
});
export const billToRow = (bill) => ({
  id: bill.id, title: bill.title, amount: bill.amount, category: bill.category,
  due_day: bill.dueDay, paid_month: bill.paidMonth,
  payment_history: bill.paymentHistory || {},
});

export async function persistBudgetChanges(userId, before, after) {
  if (before.profile !== after.profile) {
    assertText(after.profile.name, 80, 'Name');
    if ((after.profile.school || '').length > 160) throw new Error('School must be at most 160 characters.');
    const result = await supabase.from('profiles').update({ name: after.profile.name, school: after.profile.school, revision: (before.profile.revision || 0) + 1 }).eq('id', userId)
      .eq('revision', before.profile.revision || 0).select('revision').single();
    ensure(result);
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
    after.settings = { ...after.settings, revision: result.data.revision };
  }
  if (before.transactions !== after.transactions) await persistCollection('transactions', userId, before.transactions, after.transactions, transactionToRow);
  if (before.bills !== after.bills) await persistCollection('bills', userId, before.bills, after.bills, billToRow);
}

export async function deleteOwnAccount() {
  ensure(await supabase.rpc("delete_own_account"));
  await supabase.auth.signOut({ scope: "local" });
}

export async function fetchBudgetData(user) {
  const [profileResult, settingsResult, transactions, bills] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    fetchRows("transactions", user.id, "transaction_date"),
    fetchRows("bills", user.id),
  ]);
  ensure(profileResult);
  ensure(settingsResult);
  return {
    profile: profileResult.data,
    settings: settingsResult.data,
    transactions,
    bills,
  };
}

export const transactionFromRow = (row) => ({
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

export const billFromRow = (row) => ({
  revision: row.revision || 0,
  paymentHistory: row.payment_history || {},
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  category: row.category,
  dueDay: row.due_day,
  paidMonth: row.paid_month,
});

export const subscriptionToRow = (item) => ({
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

export const subscriptionFromRow = (row) => ({
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
  icon: row.icon,
  color: row.color,
  status: row.status,
  createdAt: row.created_at,
});

export const goalToRow = (goal) => ({
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
  activity: goal.activity || [],
  created_at: goal.createdAt,
});

export const goalFromRow = (row) => ({
  revision: row.revision || 0,
  startingBalance: row.starting_balance == null ? undefined : Number(row.starting_balance),
  id: row.id,
  templateId: row.template_id,
  name: row.name,
  target: Number(row.target),
  saved: Number(row.saved),
  deadline: row.deadline,
  icon: row.icon,
  color: row.color,
  notes: row.notes,
  activity: row.activity || [],
  createdAt: row.created_at,
});

export const splitToRow = (item) => ({
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

export const splitFromRow = (row) => ({
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
