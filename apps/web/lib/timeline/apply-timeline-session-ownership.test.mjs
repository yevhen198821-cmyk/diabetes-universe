import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyTimelineOwnershipSessionResolution,
  shouldOpenOwnedTimelineDatabase,
} from './apply-timeline-session-ownership.ts';
import {
  createAnonymousTimelineOwnership,
  createAuthenticatedTimelineOwnership,
} from './timeline-local-ownership.ts';

const ANON_KEY = 'anon-owner-key';

function pendingState() {
  return {
    lastAuthenticatedAccountId: null,
    ownership: { kind: 'pending' },
  };
}

function authenticatedState(accountId) {
  return {
    lastAuthenticatedAccountId: accountId,
    ownership: createAuthenticatedTimelineOwnership(accountId),
  };
}

function apply(
  current,
  resolution,
  requestIds = { latestRequestId: 1, requestId: 1 },
) {
  return applyTimelineOwnershipSessionResolution({
    anonymousOwnerKey: ANON_KEY,
    current,
    latestRequestId: requestIds.latestRequestId,
    requestId: requestIds.requestId,
    resolution,
  });
}

test('authenticated A + session refetch 503 remains A and never becomes anonymous', () => {
  const current = authenticatedState('acct-a');
  const next = apply(current, { status: 'indeterminate' });

  assert.equal(next, current);
  assert.equal(next.ownership.kind, 'authenticated');
  assert.equal(next.ownership.accountId, 'acct-a');
  assert.equal(shouldOpenOwnedTimelineDatabase(next.ownership), true);
  assert.notEqual(
    next.ownership.databaseName,
    createAnonymousTimelineOwnership(ANON_KEY).databaseName,
  );
});

test('authenticated A + session refetch 429 remains A', () => {
  const current = authenticatedState('acct-a');
  const next = apply(current, { status: 'indeterminate' });

  assert.equal(next.ownership.kind, 'authenticated');
  assert.equal(next.lastAuthenticatedAccountId, 'acct-a');
});

test('authenticated A + network failure remains A', () => {
  const current = authenticatedState('acct-a');
  const next = apply(current, { status: 'indeterminate' });

  assert.equal(next, current);
  assert.equal(next.ownership.kind, 'authenticated');
});

test('initial load + 503 does not open anonymous IndexedDB until session resolves', () => {
  const current = pendingState();
  const next = apply(current, { status: 'indeterminate' });

  assert.equal(next, current);
  assert.equal(next.ownership.kind, 'pending');
  assert.equal(shouldOpenOwnedTimelineDatabase(next.ownership), false);
});

test('initial load + network failure does not expose an anonymous medical Timeline', () => {
  const current = pendingState();
  const next = apply(current, { status: 'indeterminate' });

  assert.equal(next.ownership.kind, 'pending');
  assert.equal(shouldOpenOwnedTimelineDatabase(next.ownership), false);
});

test('explicit successful null session opens the anonymous namespace', () => {
  const next = apply(pendingState(), { status: 'anonymous' });

  assert.equal(next.ownership.kind, 'anonymous');
  assert.equal(next.lastAuthenticatedAccountId, null);
  assert.equal(next.ownership.ownerKey, ANON_KEY);
  assert.equal(shouldOpenOwnedTimelineDatabase(next.ownership), true);
});

test('successful accountId opens the authenticated namespace', () => {
  const next = apply(pendingState(), {
    accountId: 'acct-a',
    status: 'authenticated',
  });

  assert.equal(next.ownership.kind, 'authenticated');
  assert.equal(next.ownership.accountId, 'acct-a');
  assert.equal(next.lastAuthenticatedAccountId, 'acct-a');
  assert.equal(shouldOpenOwnedTimelineDatabase(next.ownership), true);
});

test('A -> successful null session switches to anonymous', () => {
  const next = apply(authenticatedState('acct-a'), { status: 'anonymous' });

  assert.equal(next.ownership.kind, 'anonymous');
  assert.equal(next.lastAuthenticatedAccountId, null);
  assert.equal(
    next.ownership.databaseName,
    createAnonymousTimelineOwnership(ANON_KEY).databaseName,
  );
});

test('stale request race: old 503 cannot overwrite newer authenticated B result', () => {
  let latestRequestId = 0;
  let state = pendingState();

  const stale503Id = ++latestRequestId;
  const newerAuthenticatedId = ++latestRequestId;

  state = apply(
    state,
    { accountId: 'acct-b', status: 'authenticated' },
    { latestRequestId, requestId: newerAuthenticatedId },
  );
  state = apply(
    state,
    { status: 'indeterminate' },
    { latestRequestId, requestId: stale503Id },
  );

  assert.equal(state.ownership.kind, 'authenticated');
  assert.equal(state.ownership.accountId, 'acct-b');
  assert.equal(state.lastAuthenticatedAccountId, 'acct-b');
});
