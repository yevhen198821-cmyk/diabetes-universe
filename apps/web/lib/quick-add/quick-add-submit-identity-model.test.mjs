import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginQuickAddSubmitEventId,
  canDismissQuickAddWhileSubmitPending,
  clearQuickAddSubmitIdentity,
  createQuickAddSubmitIdentityState,
  reconcileQuickAddSubmitEventId,
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

test('reconcileQuickAddSubmitEventId reuses the same id for an unchanged payload retry', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;
  const payloadKey = '{"doseUnits":4,"time":"08:30"}';

  const firstAttemptId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    payloadKey,
    createUuid,
  );
  const retryId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    payloadKey,
    createUuid,
  );

  assert.equal(retryId, firstAttemptId);
  assert.equal(uuidCount, 1);
});

test('reconcileQuickAddSubmitEventId allocates a new id when the payload changes', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  const firstAttemptId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    '{"doseUnits":4,"time":"08:30"}',
    createUuid,
  );
  const editedAttemptId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:31',
    '{"doseUnits":5,"time":"08:31"}',
    createUuid,
  );

  assert.notEqual(editedAttemptId, firstAttemptId);
  assert.equal(editedAttemptId, 'insulin-0831-uuid-2');
  assert.equal(uuidCount, 2);
});

test('host dismiss guard blocks while any async submit is pending', () => {
  assert.equal(canDismissQuickAddWhileSubmitPending(true), false);
  assert.equal(canDismissQuickAddWhileSubmitPending(false), true);
});

test('identity resets only after explicit clear', () => {
  const identity = createQuickAddSubmitIdentityState();
  let uuidCount = 0;
  const createUuid = () => `uuid-${++uuidCount}`;

  reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:30',
    '{"doseUnits":4,"time":"08:30"}',
    createUuid,
  );
  clearQuickAddSubmitIdentity(identity);

  const nextAttemptId = reconcileQuickAddSubmitEventId(
    identity,
    'insulin',
    '08:31',
    '{"doseUnits":4,"time":"08:31"}',
    createUuid,
  );

  assert.equal(nextAttemptId, 'insulin-0831-uuid-2');
  assert.equal(uuidCount, 2);
  assert.equal(
    identity.pendingRetryPayloadKey,
    '{"doseUnits":4,"time":"08:31"}',
  );
});
