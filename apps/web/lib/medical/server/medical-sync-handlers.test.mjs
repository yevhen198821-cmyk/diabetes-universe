import assert from 'node:assert/strict';
import test from 'node:test';
import { handleSync } from './medical-sync-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { resetMedicalApiRateLimiterForTests } from './medical-api-rate-limit.ts';
import {
  setAuthenticatedPrincipalForTests,
  setMedicalApiTestAuthEnvForTests,
} from './resolve-medical-api-scope.ts';

const principal = {
  accountId: 'actual-account',
  email: 'test@example.com',
  emailVerified: true,
  displayName: 'Test',
  avatarUrl: null,
};
const event = {
  kind: 'glucose',
  source: 'manual',
  schemaVersion: 1,
  occurredAt: '2026-08-14T10:00:00.000Z',
  concentrationMmolPerL: 5.4,
};
function request(body, account = 'actual-account') {
  return new Request('http://localhost/api/v1/medical/me/sync/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-du-expected-account-id': account,
    },
    body: JSON.stringify({ protocolVersion: 1, mutations: [body] }),
  });
}
test.beforeEach(() => {
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';
  process.env.MEDICAL_REVISION_TOKEN_SECRET =
    'test-medical-revision-token-secret';
  process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';
  process.env.MEDICAL_SYNC_ENABLED = 'true';
  setMedicalApiTestAuthEnvForTests({ nodeEnv: 'test' });
  setAuthenticatedPrincipalForTests(principal);
});
test.afterEach(async () => {
  setAuthenticatedPrincipalForTests(undefined);
  setMedicalApiTestAuthEnvForTests(null);
  resetMedicalApiRateLimiterForTests();
  await resetMedicalServiceBundleForTests();
  delete process.env.MEDICAL_SYNC_ENABLED;
});

test('sync rejects account switching and does not authorize by expected account header', async () => {
  assert.equal(
    (
      await handleSync(
        request(
          { mutationId: 'm', operation: 'create', event },
          'other-account',
        ),
        'push',
      )
    ).status,
    401,
  );
  setAuthenticatedPrincipalForTests(null);
  assert.equal(
    (
      await handleSync(
        request({ mutationId: 'm', operation: 'create', event }),
        'push',
      )
    ).status,
    401,
  );
});
test('sync is server gated and returns no-store', async () => {
  delete process.env.MEDICAL_SYNC_ENABLED;
  const response = await handleSync(
    request({ mutationId: 'm', operation: 'create', event }),
    'push',
  );
  assert.equal(response.status, 503);
  assert.match(response.headers.get('cache-control'), /no-store/);
});
test('transport replays writes and reports stale revisions as conflicts', async () => {
  const create = { mutationId: 'create', operation: 'create', event };
  const first = await (await handleSync(request(create), 'push')).json();
  assert.equal(first.results[0].status, 'acknowledged');
  assert.deepEqual(
    await (await handleSync(request(create), 'push')).json(),
    first,
  );
  const initial = first.results[0];
  const update = {
    mutationId: 'update',
    operation: 'update',
    resourceId: initial.resourceId,
    baseRevision: initial.revision,
    event: { ...event, concentrationMmolPerL: 6.8 },
  };
  assert.equal(
    (await (await handleSync(request(update), 'push')).json()).results[0]
      .status,
    'acknowledged',
  );
  const stale = await (
    await handleSync(request({ ...update, mutationId: 'stale' }), 'push')
  ).json();
  assert.equal(stale.results[0].status, 'conflict');
  assert.equal(stale.results[0].code, 'REVISION_CONFLICT');
  const invalid = await (
    await handleSync(
      request({
        mutationId: 'delete',
        operation: 'delete',
        resourceId: initial.resourceId,
        baseRevision: 'tampered',
      }),
      'push',
    )
  ).json();
  assert.equal(invalid.results[0].status, 'blocked');
  assert.equal(invalid.results[0].code, 'VALIDATION_FAILED');
});
test('invalid batch never partially commits earlier valid mutations', async () => {
  const bad = new Request('http://localhost/api/v1/medical/me/sync/push', {
    method: 'POST',
    body: JSON.stringify({
      protocolVersion: 1,
      mutations: [
        { mutationId: 'valid', operation: 'create', event },
        { mutationId: 'invalid', operation: 'delete' },
      ],
    }),
  });
  assert.equal((await handleSync(bad, 'push')).status, 422);
  const pull = await (
    await handleSync(
      new Request('http://localhost/api/v1/medical/me/sync/pull'),
      'pull',
    )
  ).json();
  assert.equal(pull.changes.length, 0);
});

test('browser transports strip local lifecycle fields before public API validation', async () => {
  const { createTimelineSyncClient } =
    await import('../client/timeline-sync-client.ts');
  const { createTimelineAdoptionClient } =
    await import('../client/timeline-adoption-client.ts');
  const { validateAdoptionBatchBody } =
    await import('./medical-adoption-validation.ts');
  const localEvent = {
    ...event,
    id: 'browser-local',
    createdAt: event.occurredAt,
    updatedAt: event.occurredAt,
  };
  const previousFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (path, options) => {
      assert.equal(
        options.headers['x-du-expected-account-id'],
        'actual-account',
      );
      const req = new Request(new URL(path, 'http://localhost'), options);
      if (path.includes('adoption-sessions')) {
        const body = JSON.parse(options.body);
        assert.equal(
          validateAdoptionBatchBody(body)[0].event.concentrationMmolPerL,
          5.4,
        );
        return Response.json({ items: [] });
      }
      return handleSync(req, path.includes('/push') ? 'push' : 'pull');
    };
    const client = createTimelineSyncClient('actual-account');
    const original = await client.push({
      mutationId: 'from-browser',
      operation: 'create',
      event: localEvent,
    });
    assert.equal(original.status, 'acknowledged');
    const pulled = await client.pull();
    assert.equal(pulled.changes.length, 1);
    await createTimelineAdoptionClient('actual-account').adoptBatch('session', [
      {
        sourceNamespace: 'source',
        localEventId: localEvent.id,
        sourceSchemaVersion: 1,
        event: localEvent,
      },
    ]);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
