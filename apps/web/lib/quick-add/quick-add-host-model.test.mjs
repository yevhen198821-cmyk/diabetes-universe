import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldCloseQuickAddOnFormCancel } from './quick-add-host-model.ts';

test('direct-open glucose cancel closes instead of returning to picker', () => {
  assert.equal(shouldCloseQuickAddOnFormCancel('glucose', undefined), true);
});

test('picker-open glucose cancel returns to category picker', () => {
  assert.equal(shouldCloseQuickAddOnFormCancel(null, 'glucose'), false);
  assert.equal(shouldCloseQuickAddOnFormCancel('glucose', 'glucose'), false);
});

test('generic category picker cancel returns to picker', () => {
  assert.equal(shouldCloseQuickAddOnFormCancel(null, undefined), false);
  assert.equal(shouldCloseQuickAddOnFormCancel(null, null), false);
});
