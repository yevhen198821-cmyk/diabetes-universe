import assert from 'node:assert/strict';
import test from 'node:test';

import {
  finalizeGlucoseQuickAddSubmit,
  shouldCloseQuickAddOnFormCancel,
} from './quick-add-host-model.ts';

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

test('finalizeGlucoseQuickAddSubmit resolves only after submit promise settles', async () => {
  let settled = false;
  const result = await finalizeGlucoseQuickAddSubmit(
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      settled = true;
    },
    {
      entry: { time: '08:30', valueMmol: 6.2 },
      eventId: 'glucose-0830-test-id',
    },
  );

  assert.equal(result, true);
  assert.equal(settled, true);
});

test('finalizeGlucoseQuickAddSubmit propagates persistence errors', async () => {
  await assert.rejects(
    finalizeGlucoseQuickAddSubmit(
      async () => {
        throw new Error('write failed');
      },
      {
        entry: { time: '08:30', valueMmol: 6.2 },
        eventId: 'glucose-0830-test-id',
      },
    ),
  );
});

test('finalizeGlucoseQuickAddSubmit returns false when submit handler is missing', async () => {
  const result = await finalizeGlucoseQuickAddSubmit(undefined, {
    entry: { time: '08:30', valueMmol: 6.2 },
    eventId: 'glucose-0830-test-id',
  });

  assert.equal(result, false);
});
