import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_FRESH_AUTH_WINDOW_SECONDS } from '../../config/auth-constants.ts';
import { isSessionFreshForPasskeyMutation } from '../passkey-freshness.ts';
import { isSessionFreshForSessionManagement } from './session-management-freshness.ts';

test('session-management freshness accepts fresh sessions inside P6b window', () => {
  const now = new Date('2026-08-11T12:05:00.000Z');
  assert.equal(
    isSessionFreshForSessionManagement('2026-08-11T12:00:30.000Z', now),
    true,
  );
  assert.equal(
    isSessionFreshForPasskeyMutation('2026-08-11T12:00:30.000Z', now),
    true,
  );
});

test('session-management freshness rejects stale sessions', () => {
  const now = new Date('2026-08-11T12:30:00.000Z');
  assert.equal(
    isSessionFreshForSessionManagement('2026-08-11T12:00:00.000Z', now),
    false,
  );
});

test('session-management freshness uses the same boundary as passkey freshness', () => {
  const createdAt = new Date('2026-08-11T12:00:00.000Z');
  const boundaryNow = new Date(
    createdAt.getTime() + AUTH_FRESH_AUTH_WINDOW_SECONDS * 1000,
  );

  assert.equal(
    isSessionFreshForSessionManagement(createdAt, boundaryNow),
    true,
  );
  assert.equal(
    isSessionFreshForSessionManagement(
      createdAt,
      new Date(boundaryNow.getTime() + 1),
    ),
    false,
  );
});
