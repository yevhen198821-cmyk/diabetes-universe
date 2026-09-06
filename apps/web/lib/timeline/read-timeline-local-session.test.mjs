import assert from 'node:assert/strict';
import test from 'node:test';

import { readTimelineSessionAccountResolution } from './read-timeline-local-session.ts';

test('session reader uses accountId and treats a null session as anonymous', async () => {
  const authenticated = await readTimelineSessionAccountResolution(async () =>
    Response.json({
      session: { id: 'sess-1' },
      user: {
        accountId: 'acct-a',
        email: 'a@example.com',
      },
    }),
  );
  assert.deepEqual(authenticated, {
    accountId: 'acct-a',
    status: 'authenticated',
  });

  const signedOut = await readTimelineSessionAccountResolution(async () =>
    Response.json(null),
  );
  assert.deepEqual(signedOut, { status: 'anonymous' });
});

test('session without accountId is blocked instead of falling back to email', async () => {
  const blocked = await readTimelineSessionAccountResolution(async () =>
    Response.json({
      session: { id: 'sess-1' },
      user: { email: 'a@example.com' },
    }),
  );
  assert.deepEqual(blocked, { status: 'blocked' });
});

test('network failure is indeterminate so an existing account context is not dropped', async () => {
  const indeterminate = await readTimelineSessionAccountResolution(async () => {
    throw new Error('offline');
  });
  assert.deepEqual(indeterminate, { status: 'indeterminate' });
});
