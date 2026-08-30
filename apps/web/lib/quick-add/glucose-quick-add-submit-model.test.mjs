import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginGlucoseQuickAddSubmitEventId,
  clearGlucoseQuickAddSubmitIdentity,
  createGlucoseQuickAddSubmitIdentityState,
  canDismissQuickAddWhileGlucoseSubmitPending,
} from './glucose-quick-add-submit-model.ts';

test('first valid submit attempt creates and stores the full event id once', () => {
  const identity = createGlucoseQuickAddSubmitIdentityState();
  let uuidCount = 0;

  const eventId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:30',
    () => `uuid-${++uuidCount}`,
  );

  assert.equal(eventId, 'glucose-0830-uuid-1');
  assert.equal(identity.pendingEventId, eventId);
  assert.equal(uuidCount, 1);
});

test('retry reuses the exact full event id after time changes', () => {
  const identity = createGlucoseQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  const firstAttemptId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:30',
    createUuid,
  );
  const retryAfterTimeChangeId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:31',
    createUuid,
  );

  assert.equal(firstAttemptId, 'glucose-0830-uuid-1');
  assert.equal(retryAfterTimeChangeId, firstAttemptId);
  assert.equal(uuidCount, 1);
});

test('retry reuses the exact full event id after value or context changes', () => {
  const identity = createGlucoseQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  const firstAttemptId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:30',
    createUuid,
  );
  const retryId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:30',
    createUuid,
  );

  assert.equal(retryId, firstAttemptId);
  assert.equal(uuidCount, 1);
});

test('identity resets only after explicit clear', () => {
  const identity = createGlucoseQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  beginGlucoseQuickAddSubmitEventId(identity, '08:30', createUuid);
  clearGlucoseQuickAddSubmitIdentity(identity);

  const nextAttemptId = beginGlucoseQuickAddSubmitEventId(
    identity,
    '08:31',
    createUuid,
  );

  assert.equal(nextAttemptId, 'glucose-0831-uuid-2');
  assert.equal(uuidCount, 2);
});

test('host dismiss guard blocks while glucose submit is pending', () => {
  assert.equal(canDismissQuickAddWhileGlucoseSubmitPending(true), false);
  assert.equal(canDismissQuickAddWhileGlucoseSubmitPending(false), true);
});
