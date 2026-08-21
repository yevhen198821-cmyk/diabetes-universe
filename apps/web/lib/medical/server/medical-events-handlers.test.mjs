import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleCreateMedicalEvent,
  handleDeleteMedicalEvent,
  handleGetMedicalEvent,
  handleListMedicalEvents,
  handleUpdateMedicalEvent,
} from './medical-events-handlers.ts';
import {
  getMedicalServiceBundle,
  resetMedicalServiceBundleForTests,
} from './get-medical-service-bundle.ts';
import {
  TEST_ACCOUNT_HEADER,
} from './resolve-medical-api-scope.ts';
import {
  MEDICAL_EVENTS_BASE_PATH,
  MEDICAL_IDEMPOTENCY_HEADER,
} from './constants.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';

const BASE_URL = 'http://localhost:3000';

function medicalEventsUrl(path = MEDICAL_EVENTS_BASE_PATH) {
  return `${BASE_URL}${path}`;
}

function authHeaders(accountId) {
  return {
    [TEST_ACCOUNT_HEADER]: accountId,
  };
}

function sampleCreateBody() {
  return JSON.stringify({
    event: {
      occurredAt: '2026-08-14T10:00:00.000Z',
      schemaVersion: 1,
      source: 'manual',
      kind: 'glucose',
      concentrationMmolPerL: 5.4,
      context: 'fasting',
    },
  });
}

test.beforeEach(async () => {
  await resetMedicalServiceBundleForTests();
});

test('unauthenticated create returns AUTH_REQUIRED', async () => {
  const response = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
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
    new Request(medicalEventsUrl(), requestInit),
  );
  assert.equal(first.status, 201);
  const firstBody = await first.json();
  assert.match(firstBody.revision, /^v1\./);
  assert.doesNotMatch(String(firstBody.revision), /^\d+$/);

  const second = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), requestInit),
  );
  assert.equal(second.status, 201);
  const secondBody = await second.json();
  assert.equal(secondBody.resourceId, firstBody.resourceId);
});

test('PATCH without If-Match returns PRECONDITION_REQUIRED', async () => {
  const createResponse = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-api-precond'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'precond-create',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );
  const created = await createResponse.json();

  const patchResponse = await handleUpdateMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
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

test('cross-account GET returns non-enumerating RESOURCE_NOT_FOUND', async () => {
  const createResponse = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-api-owner'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'owner-create',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );
  const created = await createResponse.json();

  const getResponse = await handleGetMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
      headers: authHeaders('acct-api-other'),
    }),
    created.resourceId,
  );

  assert.equal(getResponse.status, 404);
  const body = await getResponse.json();
  assert.equal(body.error.code, 'RESOURCE_NOT_FOUND');
});

test('tampered list cursor returns INVALID_CURSOR', async () => {
  await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-api-cursor'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'cursor-create',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  const listResponse = await handleListMedicalEvents(
    new Request(`${medicalEventsUrl()}?limit=1&cursor=tampered.cursor`, {
      headers: authHeaders('acct-api-cursor'),
    }),
  );

  assert.equal(listResponse.status, 400);
  const body = await listResponse.json();
  assert.equal(body.error.code, 'INVALID_CURSOR');
});

test('delete succeeds with matching If-Match', async () => {
  const createResponse = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-api-delete'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'delete-create',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );
  const created = await createResponse.json();

  const deleteResponse = await handleDeleteMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
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

test('public responses include private no-store cache control', async () => {
  const response = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders('acct-api-cache'),
    }),
  );

  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});

test('medical service bundle is reused within a test process', async () => {
  const first = await getMedicalServiceBundle();
  const second = await getMedicalServiceBundle();
  assert.equal(first, second);
});
