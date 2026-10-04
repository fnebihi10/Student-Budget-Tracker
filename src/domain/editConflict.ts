export function assertEditable<T extends { id: string; revision?: number }>(rows: readonly T[], id: string, revision?: number): T {
  const current = rows.find((row) => row.id === id);
  if (!current) throw new Error('This record was deleted on another device. Your draft is kept; close the editor and review the refreshed list.');
  assertRevision(current, revision);
  return current;
}
export function assertRevision(current: { revision?: number }, revision?: number): void {
  if (revision !== undefined && (current.revision ?? 0) !== revision) {
    throw new Error('This record changed on another device. Your draft is kept; close and reopen the editor to review the latest version before saving.');
  }
}
export function assertNewActivity(current: { revision?: number; activity: readonly { id: string }[] }, intent?: { id: string; revision: number }): void {
  if (intent && current.activity.some((entry) => entry.id === intent.id)) {
    throw new Error('This contribution was already recorded. Review goal history and close this dialog before starting another contribution.');
  }
  assertRevision(current, intent?.revision);
}
