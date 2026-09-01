import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleAdoptBatch,
  handleCreateAdoptionSession,
  setMedicalApiRateLimiterForTests,
} from './medical-adoption-handlers.ts';
import { handleGetMedicalEvent } from './medical-events-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import {
  MEDICAL_ADOPTION_BASE_PATH,
  MEDICAL_EVENTS_BASE_PATH,
} from './constants.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import { validateAdoptionBatchBody } from './medical-adoption-validation.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';
process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';
process.env.MEDICAL_ADOPTION_ENABLED = '1';

const BASE_URL = 'http://localhost:3000';

function adoptionUrl(path = MEDICAL_ADOPTION_BASE_PATH) {
  return `${BASE_URL}${path}`;
}

function authHeaders(accountId) {
  return { [TEST_ACCOUNT_HEADER]: accountId };
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

const LEGACY_INSULIN_EVENT = {
  occurredAt: '2026-09-01T09:00:00.000Z',
  schemaVersion: 1,
  source: 'manual',
  kind: 'insulin',
  preparation: 'NovoRapid',
  doseUnits: 4,
  context: 'Перед едой',
};

test.afterEach(async () => {
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
  process.env.MEDICAL_ADOPTION_ENABLED = '1';
});

test('adoption validation accepts semantic insulin without fabricating fields', () => {
  const items = validateAdoptionBatchBody({
    items: [
      {
        sourceNamespace: 'ns_semantic_insulin',
        localEventId: 'local-semantic-insulin',
        sourceSchemaVersion: 1,
        event: SEMANTIC_INSULIN_EVENT,
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.deepEqual(items[0].event, SEMANTIC_INSULIN_EVENT);
  assert.equal(Object.hasOwn(items[0].event, 'context'), false);
});

test('adoption validation accepts legacy insulin without fabricating preparationId', () => {
  const items = validateAdoptionBatchBody({
    items: [
      {
        sourceNamespace: 'ns_legacy_insulin',
        localEventId: 'local-legacy-insulin',
        sourceSchemaVersion: 1,
        event: LEGACY_INSULIN_EVENT,
      },
    ],
  });

  assert.equal(items.length, 1);
  assert.deepEqual(items[0].event, LEGACY_INSULIN_EVENT);
  assert.equal(Object.hasOwn(items[0].event, 'preparationId'), false);
  assert.equal(Object.hasOwn(items[0].event, 'administrationContext'), false);
});

test('semantic insulin adoption persists fields for later GET', async () => {
  const accountId = 'acct-insulin-wave-4e-adopt';

  const sessionResponse = await handleCreateAdoptionSession(
    new Request(adoptionUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientAdoptionRunId: 'insulin-wave-4e-run',
        sourcePlatform: 'web',
        sourceAppVersion: '1.0.0',
        sourceSchemaMin: 1,
        sourceSchemaMax: 1,
        eligibleCount: 1,
      }),
    }),
  );
  assert.equal(sessionResponse.status, 200);
  const sessionBody = await sessionResponse.json();
  const adoptionSessionId = sessionBody.session.adoptionSessionId;

  const adoptResponse = await handleAdoptBatch(
    new Request(`${adoptionUrl()}/${adoptionSessionId}/items`, {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            sourceNamespace: 'ns_insulin_wave_4e',
            localEventId: 'local-insulin-wave-4e',
            sourceSchemaVersion: 1,
            event: SEMANTIC_INSULIN_EVENT,
          },
        ],
      }),
    }),
    adoptionSessionId,
  );

  assert.equal(adoptResponse.status, 200);
  const adoptBody = await adoptResponse.json();
  assert.equal(adoptBody.items[0].status, 'adopted');
  const resourceId = adoptBody.items[0].resourceId;

  const getResponse = await handleGetMedicalEvent(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}/${resourceId}`, {
      headers: authHeaders(accountId),
    }),
    resourceId,
  );
  assert.equal(getResponse.status, 200);
  const fetched = await getResponse.json();
  assert.deepEqual(fetched.event, SEMANTIC_INSULIN_EVENT);
});

test('legacy insulin adoption remains accepted without fabricated identity', async () => {
  const accountId = 'acct-insulin-wave-4e-adopt-legacy';

  const sessionResponse = await handleCreateAdoptionSession(
    new Request(adoptionUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientAdoptionRunId: 'insulin-wave-4e-legacy-run',
        sourcePlatform: 'web',
        sourceAppVersion: '1.0.0',
        sourceSchemaMin: 1,
        sourceSchemaMax: 1,
        eligibleCount: 1,
      }),
    }),
  );
  assert.equal(sessionResponse.status, 200);
  const sessionBody = await sessionResponse.json();
  const adoptionSessionId = sessionBody.session.adoptionSessionId;

  const adoptResponse = await handleAdoptBatch(
    new Request(`${adoptionUrl()}/${adoptionSessionId}/items`, {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            sourceNamespace: 'ns_insulin_wave_4e_legacy',
            localEventId: 'local-insulin-wave-4e-legacy',
            sourceSchemaVersion: 1,
            event: LEGACY_INSULIN_EVENT,
          },
        ],
      }),
    }),
    adoptionSessionId,
  );

  assert.equal(adoptResponse.status, 200);
  const adoptBody = await adoptResponse.json();
  assert.equal(adoptBody.items[0].status, 'adopted');
  const resourceId = adoptBody.items[0].resourceId;

  const getResponse = await handleGetMedicalEvent(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}/${resourceId}`, {
      headers: authHeaders(accountId),
    }),
    resourceId,
  );
  assert.equal(getResponse.status, 200);
  const fetched = await getResponse.json();
  assert.deepEqual(fetched.event, LEGACY_INSULIN_EVENT);
  assert.equal(Object.hasOwn(fetched.event, 'preparationId'), false);
});
