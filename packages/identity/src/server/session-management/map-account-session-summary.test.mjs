import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mapAccountSessionSummary,
  mapAccountSessionSummaries,
} from './map-account-session-summary.ts';

const ownedRow = {
  id: 'session-1',
  token: 'secret-token-value',
  createdAt: new Date('2026-08-11T12:00:00.000Z'),
  expiresAt: new Date('2026-08-18T12:00:00.000Z'),
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  userId: 'user-1',
};

test('session mapper marks only exact current session id as current', () => {
  const summaries = mapAccountSessionSummaries(
    [
      ownedRow,
      {
        ...ownedRow,
        id: 'session-2',
      },
    ],
    'session-2',
  );

  assert.equal(summaries[0]?.isCurrentSession, false);
  assert.equal(summaries[1]?.isCurrentSession, true);
});

test('session mapper emits ISO timestamps and controlled labels only', () => {
  const summary = mapAccountSessionSummary(ownedRow, 'session-1');

  assert.equal(summary.sessionId, 'session-1');
  assert.equal(summary.createdAt, '2026-08-11T12:00:00.000Z');
  assert.equal(summary.expiresAt, '2026-08-18T12:00:00.000Z');
  assert.equal(summary.clientLabel, 'Chrome · macOS');
  assert.equal(summary.isCurrentSession, true);
  assert.equal('token' in summary, false);
  assert.equal('userId' in summary, false);
  assert.equal('accountId' in summary, false);
  assert.equal('ipAddress' in summary, false);
  assert.equal('userAgent' in summary, false);
  assert.doesNotMatch(JSON.stringify(summary), /secret-token-value/);
  assert.doesNotMatch(JSON.stringify(summary), /Mozilla/);
});
