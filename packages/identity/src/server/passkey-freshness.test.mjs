import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isPasskeyFreshSessionPath,
  isSessionFreshForPasskeyMutation,
} from './passkey-freshness.ts';

test('fresh passkey mutation session is accepted inside freshness window', () => {
  const now = new Date('2026-08-11T12:05:00.000Z');
  assert.equal(
    isSessionFreshForPasskeyMutation('2026-08-11T12:00:30.000Z', now),
    true,
  );
});

test('stale or invalid passkey mutation sessions are rejected', () => {
  const now = new Date('2026-08-11T12:30:00.000Z');
  assert.equal(
    isSessionFreshForPasskeyMutation('2026-08-11T12:00:00.000Z', now),
    false,
  );
  assert.equal(isSessionFreshForPasskeyMutation('invalid', now), false);
});

test('fresh-session guard targets only passkey mutation paths', () => {
  assert.equal(isPasskeyFreshSessionPath('/passkey/delete-passkey'), true);
  assert.equal(
    isPasskeyFreshSessionPath('/passkey/generate-register-options'),
    true,
  );
  assert.equal(isPasskeyFreshSessionPath('/passkey/list-user-passkeys'), false);
  assert.equal(isPasskeyFreshSessionPath('/sign-in/passkey'), false);
});
