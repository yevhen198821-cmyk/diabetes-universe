import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleCreateMedicalEvent,
  handleDeleteMedicalEvent,
  handleGetMedicalEvent,
  handleListMedicalEvents,
  handleUpdateMedicalEvent,
  setMedicalApiRateLimiterForTests,
} from './medical-events-handlers.ts';
import {
  getMedicalServiceBundle,
  resetMedicalServiceBundleForTests,
} from './get-medical-service-bundle.ts';
import { CLIENT_REQUEST_ID_HEADER } from './medical-api-request-entry.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import {
  MEDICAL_EVENTS_BASE_PATH,
  MEDICAL_IDEMPOTENCY_HEADER,
  MEDICAL_MAX_REQUEST_BYTES,
} from './constants.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';
process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';

const BASE_URL = 'http://localhost:3000';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function medicalEventsUrl(path = MEDICAL_EVENTS_BASE_PATH) {
  return `${BASE_URL}${path}`;
}

function authHeaders(accountId, extra = {}) {
  return {
    [TEST_ACCOUNT_HEADER]: accountId,
    ...extra,
  };
}

function sampleCreateBody(overrides = {}) {
  return JSON.stringify({
    event: {
      occurredAt: '2026-08-14T10:00:00.000Z',
      schemaVersion: 1,
      source: 'manual',
      kind: 'glucose',
      concentrationMmolPerL: 5.4,
      context: 'fasting',
      ...overrides,
    },
  });
}

function createRequest(url, init = {}) {
  return new Request(url, init);
}

async function createSampleEvent(
  accountId,
  idempotencyKey,
  body = sampleCreateBody(),
) {
  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        [MEDICAL_IDEMPOTENCY_HEADER]: idempotencyKey,
        'content-type': 'application/json',
      },
      body,
    }),
  );

  assert.equal(response.status, 201);
  return response.json();
}

test.beforeEach(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  delete process.env.MEDICAL_API_PRODUCTION_GATE;
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
});

test('unauthenticated create returns AUTH_REQUIRED', async () => {
  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        [TEST_ACCOUNT_HEADER]: 'anonymous',
        [MEDICAL_IDEMPOTENCY_HEADER]: 'unauth-key',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
  assert.match(body.error.correlationId, UUID_PATTERN);
});

test('authenticated self-subject create succeeds', async () => {
  const created = await createSampleEvent(
    'acct-self-success',
    'self-success-key',
  );
  assert.match(created.resourceId, UUID_PATTERN);
  assert.match(created.revision, /^v1\./);
});

test('create returns opaque revision token and replays idempotently', async () => {
  const requestInit = {
    method: 'POST',
    headers: {
      ...authHeaders('acct-api-create'),
      [MEDICAL_IDEMPOTENCY_HEADER]: 'api-create-key',
      'content-type': 'application/json',
    },
    body: sampleCreateBody(),
  };

  const first = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), requestInit),
  );
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.match(firstBody.revision, /^v1\./);
  assert.doesNotMatch(String(firstBody.revision), /^\d+$/);

  const second = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), requestInit),
  );
  assert.equal(second.status, 201);
  const secondBody = await second.json();
  assert.equal(secondBody.resourceId, firstBody.resourceId);
});

test('same idempotency key under different account does not collide', async () => {
  const body = sampleCreateBody();
  const first = await createSampleEvent('acct-idem-a', 'shared-idem-key', body);
  const second = await createSampleEvent(
    'acct-idem-b',
    'shared-idem-key',
    body,
  );
  assert.notEqual(first.resourceId, second.resourceId);
});

test('idempotency mismatch returns 409', async () => {
  await createSampleEvent('acct-idem-mismatch', 'mismatch-key');

  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-idem-mismatch'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'mismatch-key',
        'content-type': 'application/json',
      },
      body: sampleCreateBody({ concentrationMmolPerL: 8.8 }),
    }),
  );

  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error.code, 'IDEMPOTENCY_CONFLICT');
});

test('client server-owned fields are rejected', async () => {
  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-server-owned'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'server-owned-key',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          id: 'client-id',
          occurredAt: '2026-08-14T10:00:00.000Z',
          schemaVersion: 1,
          source: 'manual',
          kind: 'glucose',
          concentrationMmolPerL: 5.4,
        },
      }),
    }),
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('bounded pagination rejects excessive limit', async () => {
  const response = await handleListMedicalEvents(
    createRequest(`${medicalEventsUrl()}?limit=101`, {
      headers: authHeaders('acct-limit'),
    }),
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('PATCH without If-Match returns PRECONDITION_REQUIRED', async () => {
  const created = await createSampleEvent('acct-api-precond', 'precond-create');

  const patchResponse = await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-api-precond'),
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
    created.resourceId,
  );

  assert.equal(patchResponse.status, 428);
  const body = await patchResponse.json();
  assert.equal(body.error.code, 'PRECONDITION_REQUIRED');
});

test('PATCH with invalid If-Match token returns VALIDATION_FAILED', async () => {
  const created = await createSampleEvent(
    'acct-invalid-if-match',
    'invalid-if-match',
  );

  const patchResponse = await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-invalid-if-match'),
        'if-match': '"not-a-valid-revision-token"',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
    created.resourceId,
  );

  assert.equal(patchResponse.status, 400);
  const body = await patchResponse.json();
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('PATCH with stale revision returns REVISION_CONFLICT', async () => {
  const created = await createSampleEvent(
    'acct-stale-patch',
    'stale-patch-create',
  );

  await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-stale-patch'),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: sampleCreateBody({ concentrationMmolPerL: 6.1 }),
    }),
    created.resourceId,
  );

  const stale = await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-stale-patch'),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: sampleCreateBody({ concentrationMmolPerL: 6.2 }),
    }),
    created.resourceId,
  );

  assert.equal(stale.status, 412);
  const body = await stale.json();
  assert.equal(body.error.code, 'REVISION_CONFLICT');
});

test('PATCH with current revision succeeds and advances ETag', async () => {
  const created = await createSampleEvent(
    'acct-current-patch',
    'current-patch-create',
  );

  const response = await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-current-patch'),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: sampleCreateBody({ concentrationMmolPerL: 6.3 }),
    }),
    created.resourceId,
  );

  assert.equal(response.status, 200);
  const body = await response.json();
  assert.notEqual(body.revision, created.revision);
  assert.equal(response.headers.get('etag'), `"${body.revision}"`);
});

test('DELETE without If-Match returns PRECONDITION_REQUIRED', async () => {
  const created = await createSampleEvent(
    'acct-delete-precond',
    'delete-precond-create',
  );

  const response = await handleDeleteMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'DELETE',
      headers: authHeaders('acct-delete-precond'),
    }),
    created.resourceId,
  );

  assert.equal(response.status, 428);
  const body = await response.json();
  assert.equal(body.error.code, 'PRECONDITION_REQUIRED');
});

test('DELETE with invalid If-Match returns VALIDATION_FAILED', async () => {
  const created = await createSampleEvent(
    'acct-delete-invalid',
    'delete-invalid-create',
  );

  const response = await handleDeleteMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'DELETE',
      headers: {
        ...authHeaders('acct-delete-invalid'),
        'if-match': '"invalid-token"',
      },
    }),
    created.resourceId,
  );

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error.code, 'VALIDATION_FAILED');
});

test('DELETE with stale revision returns REVISION_CONFLICT', async () => {
  const created = await createSampleEvent(
    'acct-delete-stale',
    'delete-stale-create',
  );

  await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-delete-stale'),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: sampleCreateBody({ concentrationMmolPerL: 6.4 }),
    }),
    created.resourceId,
  );

  const response = await handleDeleteMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'DELETE',
      headers: {
        ...authHeaders('acct-delete-stale'),
        'if-match': `"${created.revision}"`,
      },
    }),
    created.resourceId,
  );

  assert.equal(response.status, 412);
  const body = await response.json();
  assert.equal(body.error.code, 'REVISION_CONFLICT');
});

test('cross-account GET returns non-enumerating RESOURCE_NOT_FOUND', async () => {
  const created = await createSampleEvent('acct-api-owner', 'owner-create');

  const getResponse = await handleGetMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      headers: authHeaders('acct-api-other'),
    }),
    created.resourceId,
  );

  assert.equal(getResponse.status, 404);
  const body = await getResponse.json();
  assert.equal(body.error.code, 'RESOURCE_NOT_FOUND');
});

test('cross-account PATCH returns non-enumerating RESOURCE_NOT_FOUND', async () => {
  const created = await createSampleEvent(
    'acct-patch-owner',
    'patch-owner-create',
  );

  const response = await handleUpdateMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders('acct-patch-other'),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
    created.resourceId,
  );

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, 'RESOURCE_NOT_FOUND');
});

test('cross-account DELETE returns non-enumerating RESOURCE_NOT_FOUND', async () => {
  const created = await createSampleEvent(
    'acct-delete-owner',
    'delete-owner-create',
  );

  const response = await handleDeleteMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'DELETE',
      headers: {
        ...authHeaders('acct-delete-other'),
        'if-match': `"${created.revision}"`,
      },
    }),
    created.resourceId,
  );

  assert.equal(response.status, 404);
  const body = await response.json();
  assert.equal(body.error.code, 'RESOURCE_NOT_FOUND');
});

test('tampered list cursor returns INVALID_CURSOR', async () => {
  await createSampleEvent('acct-api-cursor', 'cursor-create');

  const listResponse = await handleListMedicalEvents(
    createRequest(`${medicalEventsUrl()}?limit=1&cursor=tampered.cursor`, {
      headers: authHeaders('acct-api-cursor'),
    }),
  );

  assert.equal(listResponse.status, 400);
  const body = await listResponse.json();
  assert.equal(body.error.code, 'INVALID_CURSOR');
});

test('cursor wrong-subject replay is rejected', async () => {
  const ownerCursorAccount = 'acct-cursor-owner';
  await createSampleEvent(ownerCursorAccount, 'cursor-owner-create-1');
  await createSampleEvent(ownerCursorAccount, 'cursor-owner-create-2');

  const ownerList = await handleListMedicalEvents(
    createRequest(`${medicalEventsUrl()}?limit=1`, {
      headers: authHeaders(ownerCursorAccount),
    }),
  );
  const ownerPage = await ownerList.json();

  const otherList = await handleListMedicalEvents(
    createRequest(
      `${medicalEventsUrl()}?limit=1&cursor=${ownerPage.page.nextCursor}`,
      {
        headers: authHeaders('acct-cursor-other'),
      },
    ),
  );

  assert.equal(otherList.status, 400);
  const body = await otherList.json();
  assert.equal(body.error.code, 'INVALID_CURSOR');
});

test('concurrent insert does not duplicate keyset pages', async () => {
  const accountId = 'acct-keyset-stable';
  const scopeHeaders = authHeaders(accountId);

  for (let index = 0; index < 3; index += 1) {
    await createSampleEvent(
      accountId,
      `keyset-create-${index}`,
      sampleCreateBody({
        occurredAt: `2026-08-14T1${index}:00:00.000Z`,
      }),
    );
  }

  const pageOne = await handleListMedicalEvents(
    createRequest(`${medicalEventsUrl()}?limit=2`, { headers: scopeHeaders }),
  );
  const pageOneBody = await pageOne.json();

  await createSampleEvent(
    accountId,
    'keyset-late-insert',
    sampleCreateBody({
      occurredAt: '2026-08-13T09:00:00.000Z',
    }),
  );

  const pageTwo = await handleListMedicalEvents(
    createRequest(
      `${medicalEventsUrl()}?limit=2&cursor=${pageOneBody.page.nextCursor}`,
      {
        headers: scopeHeaders,
      },
    ),
  );
  const pageTwoBody = await pageTwo.json();

  const combined = [...pageOneBody.items, ...pageTwoBody.items].map(
    (item) => item.resourceId,
  );
  assert.equal(new Set(combined).size, combined.length);
});

test('delete succeeds with matching If-Match', async () => {
  const created = await createSampleEvent('acct-api-delete', 'delete-create');

  const deleteResponse = await handleDeleteMedicalEvent(
    createRequest(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'DELETE',
      headers: {
        ...authHeaders('acct-api-delete'),
        'if-match': `"${created.revision}"`,
      },
    }),
    created.resourceId,
  );

  assert.equal(deleteResponse.status, 204);
});

test('rate-limit returns stable 429 envelope with Retry-After', async (t) => {
  setMedicalApiRateLimiterForTests({
    check() {
      return { outcome: 'rate_limited', retryAfterSeconds: 60 };
    },
  });
  t.after(() => {
    setMedicalApiRateLimiterForTests(null);
  });

  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-rate-limit'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'rate-limit-key',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.equal(response.status, 429);
  const body = await response.json();
  assert.equal(body.error.code, 'RATE_LIMITED');
  assert.match(body.error.correlationId, UUID_PATTERN);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});

test('rate-limit backend unavailable returns 503 not 429', async (t) => {
  setMedicalApiRateLimiterForTests({
    check() {
      return { outcome: 'backend_unavailable' };
    },
  });
  t.after(() => {
    setMedicalApiRateLimiterForTests(null);
  });

  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-backend-down'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'backend-down-key',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
  assert.equal(response.headers.get('retry-after'), null);
});

test('oversized payload returns REQUEST_TOO_LARGE without PHI echo', async () => {
  const oversized = 'x'.repeat(MEDICAL_MAX_REQUEST_BYTES + 1);
  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-oversized'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'oversized-key',
        'content-type': 'application/json',
        'content-length': String(oversized.length),
      },
      body: oversized,
    }),
  );

  assert.equal(response.status, 413);
  const body = await response.json();
  assert.equal(body.error.code, 'REQUEST_TOO_LARGE');
  assert.doesNotMatch(JSON.stringify(body), /xxxx/);
});

test('server generates correlation ID and ignores client x-correlation-id', async () => {
  const maliciousCorrelation = `${'A'.repeat(5000)}-phi-glucose-5.4`;

  const response = await handleListMedicalEvents(
    createRequest(medicalEventsUrl(), {
      headers: {
        ...authHeaders('acct-correlation'),
        'x-correlation-id': maliciousCorrelation,
      },
    }),
  );

  assert.equal(response.status, 200);
});

test('authenticated error responses still use server correlation IDs', async () => {
  const response = await handleCreateMedicalEvent(
    createRequest(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-correlation-error'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'corr-error-key',
        'content-type': 'application/json',
        'x-correlation-id': 'client-should-not-win',
      },
      body: JSON.stringify({ event: {} }),
    }),
  );

  assert.equal(response.status, 422);
  const body = await response.json();
  assert.match(body.error.correlationId, UUID_PATTERN);
  assert.notEqual(body.error.correlationId, 'client-should-not-win');
});

test('optional bounded client request ID is accepted as metadata only', async () => {
  const response = await handleListMedicalEvents(
    createRequest(medicalEventsUrl(), {
      headers: {
        ...authHeaders('acct-client-request-id'),
        [CLIENT_REQUEST_ID_HEADER]: 'client-req-123',
      },
    }),
  );

  assert.equal(response.status, 200);
});

test('public responses include private no-store cache control', async () => {
  const response = await handleListMedicalEvents(
    createRequest(medicalEventsUrl(), {
      headers: authHeaders('acct-api-cache'),
    }),
  );

  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('error responses do not expose stack traces or SQL details', async () => {
  const response = await handleGetMedicalEvent(
    createRequest(medicalEventsUrl('/00000000-0000-4000-8000-000000000099'), {
      headers: authHeaders('acct-error-leak'),
    }),
    '00000000-0000-4000-8000-000000000099',
  );

  const serialized = JSON.stringify(await response.json());
  assert.doesNotMatch(serialized, /stack/i);
  assert.doesNotMatch(serialized, /sql/i);
  assert.doesNotMatch(serialized, /postgres/i);
});

test('additive response compatibility preserves required fields', async () => {
  const created = await createSampleEvent('acct-additive', 'additive-key');
  const requiredKeys = [
    'resourceId',
    'revision',
    'createdAt',
    'updatedAt',
    'deletedAt',
    'event',
  ];

  for (const key of requiredKeys) {
    assert.ok(key in created, `missing ${key}`);
  }
});

test('medical service bundle is reused within a test process', async () => {
  const first = await getMedicalServiceBundle();
  const second = await getMedicalServiceBundle();
  assert.equal(first, second);
});
