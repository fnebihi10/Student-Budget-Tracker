export type ExportData = {
  profile: unknown; settings: { currency: string }; categoryBudgets: unknown;
  periodBudgets: unknown; transactions: { id: string; type: string; amount: number; category: string; title: string; note?: string; date: string }[];
  bills: unknown[]; subscriptions: unknown[]; goals: unknown[]; splits: unknown[];
};
export function jsonExport(data: ExportData): string {
  return JSON.stringify({ schemaVersion: 2, app: 'Pocketwise', exportedAt: new Date().toISOString(), financialDateConvention: 'UTC civil dates', ...data }, null, 2);
}
const cell = (value: unknown): string => {
  let text = String(value ?? '');
  // Neutralize spreadsheet formula injection in user-authored text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};
export function csvExport(data: ExportData): string {
  const rows: unknown[][] = [['id', 'date_utc', 'type', 'amount', 'currency', 'category', 'title', 'note']];
  for (const t of data.transactions) rows.push([t.id, t.date.slice(0, 10), t.type, t.amount.toFixed(2), data.settings.currency, t.category, t.title, t.note || '']);
  return '\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}
