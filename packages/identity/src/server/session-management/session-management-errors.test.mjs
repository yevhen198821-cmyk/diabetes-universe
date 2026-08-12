import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSessionManagementResult,
  mapSessionManagementMessage,
  SessionManagementError,
} from './session-management-errors.ts';

test('session-management error mapping returns safe user-facing outputs', () => {
  assert.match(
    mapSessionManagementMessage('FRESH_AUTH_REQUIRED'),
    /Подтвердите вход/,
  );
  assert.match(
    mapSessionManagementMessage('SESSION_REVOKE_FAILED'),
    /Не удалось выполнить действие/,
  );
  assert.match(
    mapSessionManagementMessage('AUTHENTICATION_REQUIRED'),
    /Не удалось выполнить вход/,
  );
});

test('session-management result builder preserves code semantics', () => {
  const result = createSessionManagementResult({
    ok: false,
    code: 'CURRENT_SESSION_REQUIRES_SIGN_OUT',
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'CURRENT_SESSION_REQUIRES_SIGN_OUT');
  assert.match(result.message, /текущей сессии/);
});

test('session-management error carries stable code for fail-closed flows', () => {
  const error = new SessionManagementError(
    'SESSION_STATE_INVALID',
    mapSessionManagementMessage('SESSION_STATE_INVALID'),
  );

  assert.equal(error.code, 'SESSION_STATE_INVALID');
  assert.equal(error.name, 'SessionManagementError');
});
