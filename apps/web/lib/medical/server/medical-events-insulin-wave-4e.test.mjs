import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleCreateMedicalEvent,
  handleGetMedicalEvent,
  handleListMedicalEvents,
  handleUpdateMedicalEvent,
  setMedicalApiRateLimiterForTests,
} from './medical-events-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import {
  MEDICAL_EVENTS_BASE_PATH,
  MEDICAL_IDEMPOTENCY_HEADER,
} from './constants.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';
process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';

const BASE_URL = 'http://localhost:3000';

function medicalEventsUrl(path = MEDICAL_EVENTS_BASE_PATH) {
  return `${BASE_URL}${path}`;
}

function authHeaders(accountId, extra = {}) {
  return {
    [TEST_ACCOUNT_HEADER]: accountId,
    ...extra,
  };
}

const SEMANTIC_INSULIN_EVENT = {
  occurredAt: '2026-09-01T08:00:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  kind: 'insulin',
  preparationId: 'insulin.prep.aspart_novorapid',
  preparation: 'NovoRapid',
  doseUnits: 12.25,
  administrationContext: 'before_meal',
};

const UPDATED_SEMANTIC_INSULIN_EVENT = {
  occurredAt: '2026-09-01T08:15:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  kind: 'insulin',
  preparationId: 'insulin.prep.glargine_lantus',
  preparation: 'Lantus',
  doseUnits: 18.5,
  administrationContext: 'basal',
};

function insulinCreateBody(event = SEMANTIC_INSULIN_EVENT) {
  return JSON.stringify({ event });
}

test.beforeEach(async () => {
  process.env.NODE_ENV = 'test';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
});

test.afterEach(async () => {
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
});

test('POST create preserves semantic insulin fields through GET and LIST', async () => {
  const accountId = 'acct-insulin-wave-4e-create';
  const createResponse = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'insulin-wave-4e-create',
        'content-type': 'application/json',
      },
      body: insulinCreateBody(),
    }),
  );

  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.deepEqual(created.event, SEMANTIC_INSULIN_EVENT);

  const getResponse = await handleGetMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
      headers: authHeaders(accountId),
    }),
    created.resourceId,
  );
  assert.equal(getResponse.status, 200);
  const fetched = await getResponse.json();
  assert.deepEqual(fetched.event, SEMANTIC_INSULIN_EVENT);

  const listResponse = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders(accountId),
    }),
  );
  assert.equal(listResponse.status, 200);
  const listed = await listResponse.json();
  assert.equal(listed.items.length, 1);
  assert.deepEqual(listed.items[0].event, SEMANTIC_INSULIN_EVENT);
});

test('PATCH update preserves changed semantic insulin fields', async () => {
  const accountId = 'acct-insulin-wave-4e-patch';
  const createResponse = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'insulin-wave-4e-patch-create',
        'content-type': 'application/json',
      },
      body: insulinCreateBody(),
    }),
  );
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();

  const patchResponse = await handleUpdateMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
      method: 'PATCH',
      headers: {
        ...authHeaders(accountId),
        'if-match': `"${created.revision}"`,
        'content-type': 'application/json',
      },
      body: insulinCreateBody(UPDATED_SEMANTIC_INSULIN_EVENT),
    }),
    created.resourceId,
  );

  assert.equal(patchResponse.status, 200);
  const updated = await patchResponse.json();
  assert.deepEqual(updated.event, UPDATED_SEMANTIC_INSULIN_EVENT);
  assert.notEqual(updated.revision, created.revision);

  const getResponse = await handleGetMedicalEvent(
    new Request(medicalEventsUrl(`/${created.resourceId}`), {
      headers: authHeaders(accountId),
    }),
    created.resourceId,
  );
  assert.equal(getResponse.status, 200);
  const fetched = await getResponse.json();
  assert.deepEqual(fetched.event, UPDATED_SEMANTIC_INSULIN_EVENT);
});

test('glucose create remains accepted after insulin allow-list expansion', async () => {
  const response = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-insulin-wave-4e-glucose'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'insulin-wave-4e-glucose',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        event: {
          occurredAt: '2026-09-01T08:00:00.000Z',
          schemaVersion: 1,
          source: 'manual',
          kind: 'glucose',
          concentrationMmolPerL: 5.4,
          context: 'fasting',
        },
      }),
    }),
  );

  assert.equal(response.status, 201);
  const body = await response.json();
  assert.equal(body.event.kind, 'glucose');
  assert.equal(body.event.concentrationMmolPerL, 5.4);
});
