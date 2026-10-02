import { expect, test } from '@jest/globals';
import { diagnosticSnapshot, recordDiagnostic } from '../diagnostics';
test('diagnostic events have a bounded, redacted schema', () => {
  for (let n=0;n<30;n++) recordDiagnostic('cloud_write_unconfirmed');
  const events=diagnosticSnapshot();
  expect(events).toHaveLength(20);
  expect(Object.keys(events[0]).sort()).toEqual(['at','code']);
  expect(events[0].code).toBe('cloud_write_unconfirmed');
});
