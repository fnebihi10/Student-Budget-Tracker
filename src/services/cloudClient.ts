import { supabase } from '../lib/supabase';

// The runtime client rejects network access when unconfigured for demo use.
// Finance callers only access this client after a verified authenticated scope.
export const cloudClient = supabase;
export async function completeMonthlyTotals(period: string, signal?: AbortSignal): Promise<{ income: number; expenses: number; monthlyNet: number }> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Invalid period');
  const query = cloudClient.rpc('monthly_totals', { period });
  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('No aggregate response');
  const result = { income: Number(row.income), expenses: Number(row.expenses), monthlyNet: Number(row.monthly_net) };
  if (!Object.values(result).every(Number.isFinite)) throw new Error('Invalid aggregate response');
  return result;
}
