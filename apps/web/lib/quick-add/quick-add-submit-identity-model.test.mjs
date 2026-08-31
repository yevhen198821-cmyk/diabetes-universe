import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginQuickAddSubmitEventId,
  canDismissQuickAddWhileSubmitPending,
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
} from './quick-add-submit-identity-model.ts';

test('first valid insulin submit attempt creates and stores the full event id once', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;

  const eventId = beginQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    () => `uuid-${++uuidCount}`,
  );

  assert.equal(eventId, 'insulin-0830-uuid-1');
  assert.equal(identity.pendingEventId, eventId);
  assert.equal(uuidCount, 1);
});

test('insulin retry reuses the exact full event id after field changes', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  const firstAttemptId = beginQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    createUuid,
  );
  const retryId = beginQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:31',
    createUuid,
  );

  assert.equal(retryId, firstAttemptId);
  assert.equal(uuidCount, 1);
});

test('host dismiss guard blocks while any async submit is pending', () => {
  assert.equal(canDismissQuickAddWhileSubmitPending(true), false);
  assert.equal(canDismissQuickAddWhileSubmitPending(false), true);
});

test('identity resets only after explicit clear', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  beginQuickAddSubmitEventId(identity, 'insulin', '08:30', createUuid);
  clearQuickAddSubmitIdentity(identity);

  const nextAttemptId = beginQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:31',
    createUuid,
  );

  assert.equal(nextAttemptId, 'insulin-0831-uuid-2');
  assert.equal(uuidCount, 2);
});
