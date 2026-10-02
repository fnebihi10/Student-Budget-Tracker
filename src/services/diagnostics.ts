export type DiagnosticCode = 'render_failed' | 'cloud_load_failed' | 'cloud_write_unconfirmed' | 'cache_failed';
const events: { code: DiagnosticCode; at: string }[] = [];
// No user IDs, amounts, names, URLs, tokens, error messages or stacks.
export function recordDiagnostic(code: DiagnosticCode): void {
  events.push({ code, at: new Date().toISOString() });
  if (events.length > 20) events.shift();
}
export function diagnosticSnapshot(): readonly { code: DiagnosticCode; at: string }[] {
  return events.map((event) => ({ ...event }));
}
