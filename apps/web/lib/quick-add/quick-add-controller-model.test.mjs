import assert from 'node:assert/strict';
import test from 'node:test';

import {
  closeQuickAdd,
  createQuickAddOpeningLock,
  releaseQuickAddOpeningLock,
  requestQuickAddOpen,
  shouldApplyQuickAddSave,
  shouldKeepQuickAddOpenAfterSubmit,
} from './quick-add-controller-model.ts';

test('ignores repeated open requests while Quick Add is already open', () => {
  assert.equal(
    requestQuickAddOpen({ isOpen: true, isOpeningLocked: false }),
    'ignored',
  );
});

test('ignores repeated open requests while an opening lock is active', () => {
  assert.equal(
    requestQuickAddOpen({ isOpen: false, isOpeningLocked: true }),
    'ignored',
  );
});

test('allows the first open request and creates an opening lock', () => {
  const nextState = createQuickAddOpeningLock({
    isOpen: false,
    isOpeningLocked: false,
  });

  assert.ok(nextState);
  assert.equal(nextState.isOpen, true);
  assert.equal(nextState.isOpeningLocked, true);
});

test('releases the opening lock after the panel becomes open', () => {
  const released = releaseQuickAddOpeningLock({
    isOpen: true,
    isOpeningLocked: true,
  });

  assert.equal(released.isOpen, true);
  assert.equal(released.isOpeningLocked, false);
});

test('closes Quick Add and clears the opening lock', () => {
  const closed = closeQuickAdd();

  assert.equal(closed.isOpen, false);
  assert.equal(closed.isOpeningLocked, false);
});

test('applies dashboard updates only after a successful save', () => {
  assert.equal(shouldApplyQuickAddSave('success'), true);
  assert.equal(shouldApplyQuickAddSave('cancel'), false);
  assert.equal(shouldApplyQuickAddSave('dismiss'), false);
});

test('keeps Quick Add open when submit fails validation', () => {
  assert.equal(shouldKeepQuickAddOpenAfterSubmit(false), true);
  assert.equal(shouldKeepQuickAddOpenAfterSubmit(true), false);
});
