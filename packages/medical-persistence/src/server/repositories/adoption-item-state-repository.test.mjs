import assert from 'node:assert/strict';
import test from 'node:test';

import { computeAdoptionItemCounterDelta } from './adoption-item-state-repository.ts';

test('computeAdoptionItemCounterDelta records first unresolved failure once', () => {
  assert.deepEqual(computeAdoptionItemCounterDelta(null, 'failed'), {
    adoptedCount: 0,
    skippedCount: 0,
    failedCount: 1,
  });
  assert.deepEqual(computeAdoptionItemCounterDelta('failed', 'failed'), {
    adoptedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  });
});

test('computeAdoptionItemCounterDelta resolves failure on success', () => {
  assert.deepEqual(computeAdoptionItemCounterDelta('failed', 'adopted'), {
    adoptedCount: 1,
    skippedCount: 0,
    failedCount: -1,
  });
  assert.deepEqual(computeAdoptionItemCounterDelta('failed', 'reconciled'), {
    adoptedCount: 0,
    skippedCount: 1,
    failedCount: -1,
  });
});

test('computeAdoptionItemCounterDelta ignores replay after reconciliation', () => {
  assert.deepEqual(computeAdoptionItemCounterDelta('adopted', 'adopted'), {
    adoptedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  });
  assert.deepEqual(
    computeAdoptionItemCounterDelta('reconciled', 'reconciled'),
    {
      adoptedCount: 0,
      skippedCount: 0,
      failedCount: 0,
    },
  );
});
