import { expect, test } from '@jest/globals';
import { assertEditable, assertRevision, assertNewActivity } from '../editConflict';
test('an open draft cannot overwrite a refreshed revision or recreate a deleted record', () => {
  expect(() => assertEditable([{ id: 'A', revision: 2 }], 'A', 1)).toThrow('changed on another device');
  expect(() => assertEditable([], 'A', 1)).toThrow('deleted on another device');
  expect(assertEditable([{ id: 'A', revision: 2 }], 'A', 2).revision).toBe(2);
});
test('lost contribution responses and remote revisions cannot debit savings twice', () => {
  const intent = { id: 'stable-withdrawal', revision: 1 };
  expect(() => assertNewActivity({ revision: 2, activity: [{ id: intent.id }] }, intent)).toThrow('already recorded');
  expect(() => assertNewActivity({ revision: 2, activity: [] }, intent)).toThrow('changed on another device');
  expect(() => assertNewActivity({ revision: 1, activity: [] }, intent)).not.toThrow();
});
test('settings modal rejects a draft opened before a refreshed category plan', () => {
  expect(() => assertRevision({ revision: 4 }, 3)).toThrow('changed on another device');
  expect(() => assertRevision({}, 0)).not.toThrow();
});
