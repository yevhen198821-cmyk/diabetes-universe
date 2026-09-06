import assert from 'node:assert/strict';
import test from 'node:test';

import { readTimelineSessionAccountResolution } from './read-timeline-local-session.ts';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

test('successful accountId opens an authenticated resolution', async () => {
  const authenticated = await readTimelineSessionAccountResolution(async () =>
    jsonResponse({
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
});

test('successful null session is the only proven signed-out resolution', async () => {
  const signedOut = await readTimelineSessionAccountResolution(async () =>
    jsonResponse(null),
  );
  assert.deepEqual(signedOut, { status: 'anonymous' });
});

test('session without accountId is blocked instead of falling back to email', async () => {
  const blocked = await readTimelineSessionAccountResolution(async () =>
    jsonResponse({
      session: { id: 'sess-1' },
      user: { email: 'a@example.com' },
    }),
  );
  assert.deepEqual(blocked, { status: 'blocked' });
});

test('HTTP 503 is indeterminate and is not inferred as logout', async () => {
  const resolution = await readTimelineSessionAccountResolution(async () =>
    jsonResponse({ error: 'unavailable' }, 503),
  );
  assert.deepEqual(resolution, { status: 'indeterminate' });
});

test('HTTP 429 is indeterminate and is not inferred as logout', async () => {
  const resolution = await readTimelineSessionAccountResolution(async () =>
    jsonResponse({ error: 'rate limited' }, 429),
  );
  assert.deepEqual(resolution, { status: 'indeterminate' });
});

test('unexpected non-success HTTP status is indeterminate', async () => {
  const resolution = await readTimelineSessionAccountResolution(async () =>
    jsonResponse({ error: 'unauthorized' }, 401),
  );
  assert.deepEqual(resolution, { status: 'indeterminate' });
});

test('network failure is indeterminate so an existing account context is not dropped', async () => {
  const indeterminate = await readTimelineSessionAccountResolution(async () => {
    throw new Error('offline');
  });
  assert.deepEqual(indeterminate, { status: 'indeterminate' });
});
