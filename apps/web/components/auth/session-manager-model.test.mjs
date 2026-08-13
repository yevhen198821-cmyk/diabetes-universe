import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSessionManagerViewModel,
  shouldShowFreshAuthAlert,
} from './session-manager-model.ts';

/** @type {import('@diabetes-universe/identity').AccountSessionSummary} */
const currentSession = {
  sessionId: 'session-current',
  isCurrentSession: true,
  createdAt: '2026-08-12T10:00:00.000Z',
  expiresAt: '2026-08-19T10:00:00.000Z',
  clientLabel: 'Chrome · macOS',
  clientKind: 'browser',
};

/** @type {import('@diabetes-universe/identity').AccountSessionSummary} */
const otherSession = {
  sessionId: 'session-other',
  isCurrentSession: false,
  createdAt: '2026-08-11T10:00:00.000Z',
  expiresAt: '2026-08-18T10:00:00.000Z',
  clientLabel: 'Safari · iPhone',
  clientKind: 'mobile',
};

test('createSessionManagerViewModel trusts isCurrentSession only', () => {
  const viewModel = createSessionManagerViewModel([
    otherSession,
    currentSession,
  ]);

  assert.equal(viewModel.currentSession?.sessionId, 'session-current');
  assert.deepEqual(
    viewModel.otherSessions.map((session) => session.sessionId),
    ['session-other'],
  );
});

test('createSessionManagerViewModel hides revoke others when no other sessions exist', () => {
  const viewModel = createSessionManagerViewModel([currentSession]);

  assert.equal(viewModel.showRevokeOthersAction, false);
});

test('createSessionManagerViewModel shows revoke others when other sessions exist', () => {
  const viewModel = createSessionManagerViewModel([
    currentSession,
    otherSession,
  ]);

  assert.equal(viewModel.showRevokeOthersAction, true);
});

test('shouldShowFreshAuthAlert is true only for FRESH_AUTH_REQUIRED', () => {
  assert.equal(shouldShowFreshAuthAlert('FRESH_AUTH_REQUIRED'), true);
  assert.equal(shouldShowFreshAuthAlert('SESSION_REVOKE_FAILED'), false);
  assert.equal(shouldShowFreshAuthAlert(undefined), false);
});
