export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
type Versioned = { revision: number };
type Owned = Versioned & { id: string; user_id: string; created_at: string };
type Table<R, Required extends keyof R> = { Row: R; Insert: Pick<R, Required> & Partial<R>; Update: Partial<R>; Relationships: [] };
type ProfileRow = Versioned & { id: string; name: string; school: string; created_at: string; updated_at: string };
type SettingsRow = Versioned & { user_id: string; currency: 'EUR' | 'USD' | 'GBP' | 'HUF'; monthly_budget: number; notifications: boolean; category_budgets: Json; period_budgets: Json; subscription_plan: 'free' | 'pro'; subscription_status: 'inactive' | 'active' | 'canceled'; updated_at: string };
type TransactionRow = Owned & { type: 'income' | 'expense'; amount: number; category: string; title: string; note: string; transaction_date: string; recurring: boolean };
type BillRow = Owned & { title: string; amount: number; category: string; due_day: number; paid_month: string | null; payment_history: Json };
type SubscriptionRow = Owned & { service_id: string; name: string; amount: number; frequency: 'weekly' | 'monthly' | 'yearly'; next_billing_date: string; category: string; reminder_days: number; notes: string; free_trial: boolean; icon: string | null; color: string | null; status: 'active' | 'paused' };
type GoalRow = Owned & { template_id: string; name: string; target: number; saved: number; starting_balance: number; deadline: string | null; icon: string | null; color: string | null; notes: string; activity: Json };
type SplitRow = Owned & { title: string; person: string; amount: number; direction: 'owed_to_me' | 'i_owe'; category: string; due_date: string | null; note: string; status: 'open' | 'settled'; settled_at: string | null };
export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, 'id'>;
      user_settings: Table<SettingsRow, 'user_id'>;
      transactions: Table<TransactionRow, 'user_id' | 'type' | 'amount' | 'category' | 'title'>;
      bills: Table<BillRow, 'user_id' | 'title' | 'amount' | 'category' | 'due_day'>;
      subscriptions: Table<SubscriptionRow, 'user_id' | 'name' | 'amount' | 'frequency' | 'next_billing_date'>;
      goals: Table<GoalRow, 'user_id' | 'name' | 'target'>;
      splits: Table<SplitRow, 'user_id' | 'title' | 'person' | 'amount' | 'direction'>;
      deleted_financial_records: Table<{ table_name: string; record_id: string; user_id: string; deleted_at: string }, 'table_name' | 'record_id' | 'user_id'>;
    };
    Views: Record<never, never>;
    Functions: { delete_own_account: { Args: Record<never, never>; Returns: undefined }; monthly_totals: { Args: { period: string }; Returns: { income: number; expenses: number; monthly_net: number }[] } };
    Enums: Record<never, never>; CompositeTypes: Record<never, never>;
  };
};
export type RowOf<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
