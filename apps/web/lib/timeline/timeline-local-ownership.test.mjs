import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME,
  assertOwnedTimelineDatabaseName,
  createAnonymousTimelineDatabaseName,
  createAnonymousTimelineOwnership,
  createAuthenticatedTimelineDatabaseName,
  createAuthenticatedTimelineOwnership,
  encodeTimelineOwnerToken,
  parseTimelineAccountId,
  readAccountIdFromSessionPayload,
  resolveAnonymousOwnerKey,
  resolveTimelineOwnershipFromSession,
} from './timeline-local-ownership.ts';

test('accountId is accepted and email is never used as ownership identity', () => {
  assert.equal(parseTimelineAccountId('acct-123'), 'acct-123');
  assert.equal(parseTimelineAccountId('  acct-123  '), 'acct-123');
  assert.equal(parseTimelineAccountId(''), null);
  assert.equal(parseTimelineAccountId('a'.repeat(129)), null);

  assert.equal(
    readAccountIdFromSessionPayload({
      user: {
        accountId: 'acct-owned',
        email: 'owner@example.com',
      },
    }),
    'acct-owned',
  );
  assert.equal(
    readAccountIdFromSessionPayload({
      user: { email: 'owner@example.com' },
    }),
    null,
  );
  assert.equal(readAccountIdFromSessionPayload(null), null);
});

test('database names encode accountId and never include email or legacy name', () => {
  const accountId = 'acct-owned';
  const databaseName = createAuthenticatedTimelineDatabaseName(accountId);

  assert.equal(
    databaseName,
    `du-timeline-acct-${encodeTimelineOwnerToken(accountId)}`,
  );
  assert.equal(databaseName.includes('example.com'), false);
  assert.equal(databaseName.includes(accountId), false);
  assert.notEqual(databaseName, LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME);

  const anonymousName = createAnonymousTimelineDatabaseName('anon-key-1');
  assert.equal(
    anonymousName,
    `du-timeline-anon-${encodeTimelineOwnerToken('anon-key-1')}`,
  );
  assert.notEqual(anonymousName, databaseName);
});

test('legacy unscoped database cannot be opened as an owned store', () => {
  assert.throws(
    () =>
      assertOwnedTimelineDatabaseName(LEGACY_UNSCOPED_TIMELINE_DATABASE_NAME),
    /Legacy unscoped/,
  );
  assert.equal(
    assertOwnedTimelineDatabaseName(
      createAuthenticatedTimelineDatabaseName('acct-a'),
    ),
    createAuthenticatedTimelineDatabaseName('acct-a'),
  );
});

test('session resolution keeps anonymous and authenticated stores separate', () => {
  const anonymous = resolveTimelineOwnershipFromSession({
    accountId: null,
    anonymousOwnerKey: 'anon-stable',
  });
  const accountA = resolveTimelineOwnershipFromSession({
    accountId: 'acct-a',
    anonymousOwnerKey: 'anon-stable',
  });
  const accountB = resolveTimelineOwnershipFromSession({
    accountId: 'acct-b',
    anonymousOwnerKey: 'anon-stable',
  });

  assert.equal(anonymous.kind, 'anonymous');
  assert.equal(accountA.kind, 'authenticated');
  assert.equal(accountB.kind, 'authenticated');
  assert.notEqual(anonymous.databaseName, accountA.databaseName);
  assert.notEqual(accountA.databaseName, accountB.databaseName);

  const blocked = resolveTimelineOwnershipFromSession({
    accountId: null,
    anonymousOwnerKey: 'anon-stable',
    sessionPresentWithoutAccountId: true,
  });
  assert.deepEqual(blocked, { kind: 'blocked' });
});

test('anonymous owner key is stable in browser-local storage', () => {
  const storage = new Map();
  const fakeStorage = {
    getItem(key) {
      return storage.get(key) ?? null;
    },
    setItem(key, value) {
      storage.set(key, value);
    },
  };

  const first = resolveAnonymousOwnerKey(fakeStorage);
  const second = resolveAnonymousOwnerKey(fakeStorage);

  assert.equal(first, second);
  assert.equal(createAnonymousTimelineOwnership(first).kind, 'anonymous');
  assert.equal(
    createAuthenticatedTimelineOwnership('acct-a').accountId,
    'acct-a',
  );
});
