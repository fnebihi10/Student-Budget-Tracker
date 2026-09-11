import * as Crypto from "expo-crypto";
import { supabase } from "../lib/supabase";

export const newId = () => Crypto.randomUUID();

const ensure = ({ error }) => {
  if (error) throw error;
};

export async function fetchRows(table, userId, orderColumn = "created_at") {
  const result = await supabase
    .from(table)
    .select("*")
    .eq("user_id", userId)
    .order(orderColumn, { ascending: false });
  ensure(result);
  return result.data || [];
}

export async function upsertRows(table, userId, rows) {
  if (!rows.length) return;
  ensure(
    await supabase.from(table).upsert(
      rows.map((row) => ({ ...row, user_id: userId })),
      { onConflict: "id" }
    )
  );
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

export async function syncBudgetData(userId, data) {
  const profileResult = await supabase.from("profiles").upsert({
    id: userId,
    name: data.profile.name,
    school: data.profile.school,
  });
  ensure(profileResult);

  const settingsResult = await supabase.from("user_settings").upsert({
    user_id: userId,
    currency: data.settings.currency,
    monthly_budget: data.settings.monthlyBudget,
    notifications: data.settings.notifications,
    category_budgets: data.categoryBudgets,
    subscription_plan: data.subscription.plan,
    subscription_status: data.subscription.status,
  });
  ensure(settingsResult);

  await upsertRows(
    "transactions",
    userId,
    data.transactions.map((item) => ({
      id: item.id,
      type: item.type,
      amount: item.amount,
      category: item.category,
      title: item.title,
      note: item.note || "",
      transaction_date: item.date,
      recurring: Boolean(item.recurring),
    }))
  );
  await upsertRows(
    "bills",
    userId,
    data.bills.map((bill) => ({
      id: bill.id,
      title: bill.title,
      amount: bill.amount,
      category: bill.category,
      due_day: bill.dueDay,
      paid_month: bill.paidMonth,
    }))
  );
}

export const transactionFromRow = (row) => ({
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
