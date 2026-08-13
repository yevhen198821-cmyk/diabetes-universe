import assert from 'node:assert/strict';
import test from 'node:test';

import {
  SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
  SESSION_FRESH_AUTH_REQUIRED_MESSAGE,
  SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  SESSION_MANAGEMENT_SUCCESS_MESSAGE,
} from '@diabetes-universe/identity/server';

import {
  ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK,
  ACCOUNT_SECURITY_SESSIONS_PATH,
  createInvalidSessionIdMutationState,
  mapSessionManagementResultToMutationOutcome,
  parseRevokeSessionId,
} from './session-management-mutation.ts';

test('parseRevokeSessionId rejects empty sessionId values', () => {
  assert.equal(parseRevokeSessionId(createFormData({ sessionId: '' })), null);
  assert.equal(
    parseRevokeSessionId(createFormData({ sessionId: '   ' })),
    null,
  );
  assert.equal(parseRevokeSessionId(new FormData()), null);
});

test('parseRevokeSessionId accepts trimmed sessionId', () => {
  assert.equal(
    parseRevokeSessionId(createFormData({ sessionId: ' session-1 ' })),
    'session-1',
  );
});

test('createInvalidSessionIdMutationState returns generic safe error', () => {
  assert.deepEqual(createInvalidSessionIdMutationState(), {
    status: 'error',
    message: SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  });
});

test('success maps to revalidation on sessions path', () => {
  const outcome = mapSessionManagementResultToMutationOutcome(
    {
      ok: true,
      code: 'SUCCESS',
      message: SESSION_MANAGEMENT_SUCCESS_MESSAGE,
    },
    { revalidateOnSuccess: true },
  );

  assert.equal(outcome.action, 'return-state');
  assert.equal(outcome.revalidatePath, ACCOUNT_SECURITY_SESSIONS_PATH);
  assert.equal(outcome.state.status, 'success');
});

test('foreign or missing revoke remains safe success semantics', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: true,
    code: 'SUCCESS',
    message: SESSION_MANAGEMENT_SUCCESS_MESSAGE,
  });

  assert.equal(outcome.action, 'return-state');
  assert.equal(outcome.state.status, 'success');
});

test('FRESH_AUTH_REQUIRED maps to inline fresh-auth state', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: false,
    code: 'FRESH_AUTH_REQUIRED',
    message: SESSION_FRESH_AUTH_REQUIRED_MESSAGE,
  });

  assert.equal(outcome.action, 'return-state');
  assert.equal(outcome.state.code, 'FRESH_AUTH_REQUIRED');
  assert.equal(outcome.state.message, SESSION_FRESH_AUTH_REQUIRED_MESSAGE);
});

test('AUTHENTICATION_REQUIRED maps to auth recovery redirect', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: false,
    code: 'AUTHENTICATION_REQUIRED',
    message: 'hidden',
  });

  assert.equal(outcome.action, 'redirect-auth');
});

test('SESSION_STATE_INVALID maps to fail-closed auth recovery redirect', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: false,
    code: 'SESSION_STATE_INVALID',
    message: SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  });

  assert.equal(outcome.action, 'redirect-auth');
});

test('CURRENT_SESSION_REQUIRES_SIGN_OUT maps to safe inline message', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: false,
    code: 'CURRENT_SESSION_REQUIRES_SIGN_OUT',
    message: SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
  });

  assert.equal(outcome.action, 'return-state');
  assert.equal(
    outcome.state.message,
    SESSION_CURRENT_REQUIRES_SIGN_OUT_MESSAGE,
  );
});

test('SESSION_REVOKE_FAILED maps to generic retryable error', () => {
  const outcome = mapSessionManagementResultToMutationOutcome({
    ok: false,
    code: 'SESSION_REVOKE_FAILED',
    message: SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
  });

  assert.equal(outcome.action, 'return-state');
  assert.equal(outcome.state.status, 'error');
});

test('revoke all success redirects to auth without revalidation', () => {
  const outcome = mapSessionManagementResultToMutationOutcome(
    {
      ok: true,
      code: 'SUCCESS',
      message: SESSION_MANAGEMENT_SUCCESS_MESSAGE,
    },
    { revokeAllSuccessRedirect: true },
  );

  assert.equal(outcome.action, 'redirect-auth-after-revoke-all');
  assert.equal(outcome.revalidatePath, undefined);
});

test('revoke all failure does not use success redirect action', () => {
  const outcome = mapSessionManagementResultToMutationOutcome(
    {
      ok: false,
      code: 'SESSION_REVOKE_FAILED',
      message: SESSION_MANAGEMENT_GENERIC_FAILURE_MESSAGE,
    },
    { revokeAllSuccessRedirect: true },
  );

  assert.equal(outcome.action, 'return-state');
});

test('reauthenticate callback targets sessions route', () => {
  assert.equal(
    ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK,
    '/auth?callback=/account/security/sessions',
  );
});

function createFormData(fields) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}
