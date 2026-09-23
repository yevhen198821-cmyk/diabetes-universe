import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSessionOwnerResponse } from './normalize-session-owner-response.ts';

test('omitted owner is restored canonically, never from user.id', async () => {
  const response = Response.json(
    { session: { id: 'session' }, user: { id: 'different-user-id' } },
    { headers: { 'Set-Cookie': 'test-cookie=retained; HttpOnly' } },
  );
  const restored = await normalizeSessionOwnerResponse(response, async () => ({
    accountId: 'original-account-owner',
  }));
  assert.equal(restored.status, 200);
  assert.equal(
    (await restored.json()).user.accountId,
    'original-account-owner',
  );
  assert.equal(
    restored.headers.get('set-cookie'),
    'test-cookie=retained; HttpOnly',
  );
  assert.equal(restored.headers.get('cache-control'), 'private, no-store');
});

test('existing owner and anonymous response need no recovery', async () => {
  for (const payload of [
    null,
    { session: { id: 'session' }, user: { accountId: 'original-owner' } },
  ]) {
    const response = Response.json(payload);
    const normalized = await normalizeSessionOwnerResponse(response, () => {
      throw new Error('Recovery must not be called');
    });
    assert.equal(normalized, response);
  }
});

test('failed lookup cannot become a different owner or anonymous success', async () => {
  for (const resolveOwner of [
    async () => null,
    async () => {
      throw new Error('database unavailable');
    },
  ]) {
    const response = Response.json({
      session: { id: 'session' },
      user: { id: 'different-user-id' },
    });
    const normalized = await normalizeSessionOwnerResponse(
      response,
      resolveOwner,
    );
    assert.equal(normalized.status, 503);
    assert.deepEqual(await normalized.json(), {
      error: 'SESSION_OWNER_UNAVAILABLE',
    });
  }
});

test('non-success session response is preserved', async () => {
  const response = new Response(null, { status: 429 });
  const normalized = await normalizeSessionOwnerResponse(response, () => {
    throw new Error('Recovery must not be called');
  });
  assert.equal(normalized, response);
});
