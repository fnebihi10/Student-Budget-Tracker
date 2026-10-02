import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from './database';

// The runtime client also supplies a demo-only auth adapter when unconfigured.
// Finance callers only access this client after a verified authenticated scope.
export const cloudClient = supabase as unknown as SupabaseClient<Database>;
export async function completeMonthlyTotals(period: string): Promise<{ income: number; expenses: number; monthlyNet: number }> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Invalid period');
  const { data, error } = await cloudClient.rpc('monthly_totals', { period });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('No aggregate response');
  return { income: Number(row.income), expenses: Number(row.expenses), monthlyNet: Number(row.monthly_net) };
}
