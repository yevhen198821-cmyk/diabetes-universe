import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleAdoptBatch,
  handleCreateAdoptionSession,
  setMedicalApiRateLimiterForTests,
} from './medical-adoption-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import {
  MEDICAL_ADOPTION_BASE_PATH,
  MEDICAL_EVENTS_BASE_PATH,
} from './constants.ts';
import { handleGetMedicalEvent } from './medical-events-handlers.ts';

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

test.afterEach(async () => {
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
  process.env.MEDICAL_ADOPTION_ENABLED = '1';
});

test('create adoption session and adopt item', async () => {
  const accountId = 'acct-adoption-handler';

  const sessionResponse = await handleCreateAdoptionSession(
    new Request(adoptionUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders(accountId),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientAdoptionRunId: 'handler-run-1',
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
            sourceNamespace: 'ns_handler_1',
            localEventId: 'local-handler-1',
            sourceSchemaVersion: 1,
            event: {
              occurredAt: '2026-08-14T10:00:00.000Z',
              schemaVersion: 1,
              source: 'manual',
              kind: 'glucose',
              concentrationMmolPerL: 5.2,
              context: 'fasting',
            },
          },
        ],
      }),
    }),
    adoptionSessionId,
  );

  assert.equal(adoptResponse.status, 200);
  const adoptBody = await adoptResponse.json();
  assert.equal(adoptBody.items[0].status, 'adopted');
  assert.match(adoptBody.items[0].resourceId, /^[0-9a-f-]{36}$/i);
});

test('adoption disabled returns safe error', async () => {
  delete process.env.MEDICAL_ADOPTION_ENABLED;
  await resetMedicalServiceBundleForTests();

  const response = await handleCreateAdoptionSession(
    new Request(adoptionUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-adoption-disabled'),
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        clientAdoptionRunId: 'handler-run-disabled',
        sourcePlatform: 'web',
        sourceAppVersion: '1.0.0',
        sourceSchemaMin: 1,
        sourceSchemaMax: 1,
      }),
    }),
  );

  assert.equal(response.status, 403);
  const body = await response.json();
  assert.equal(body.error.details?.code, 'ADOPTION_NOT_ENABLED');

  process.env.MEDICAL_ADOPTION_ENABLED = '1';
});

test('adoption persists semantic and legacy insulin without fabricating identity', async () => {
  const accountId = 'acct-adoption-insulin-wave-4e';
  const semanticEvent = {
    occurredAt: '2026-09-01T08:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'insulin',
    preparationId: 'insulin.prep.aspart_novorapid',
    preparation: 'NovoRapid',
    doseUnits: 12.25,
    administrationContext: 'before_meal',
  };
  const legacyEvent = {
    occurredAt: '2026-09-01T09:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'insulin',
    preparation: 'NovoRapid',
    doseUnits: 4,
    context: 'Перед едой',
  };

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
        eligibleCount: 2,
      }),
    }),
  );
  assert.equal(sessionResponse.status, 200);
  const adoptionSessionId = (await sessionResponse.json()).session
    .adoptionSessionId;

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
            localEventId: 'local-insulin-semantic',
            sourceSchemaVersion: 1,
            event: semanticEvent,
          },
          {
            sourceNamespace: 'ns_insulin_wave_4e',
            localEventId: 'local-insulin-legacy',
            sourceSchemaVersion: 1,
            event: legacyEvent,
          },
        ],
      }),
    }),
    adoptionSessionId,
  );
  assert.equal(adoptResponse.status, 200);
  const adoptBody = await adoptResponse.json();
  assert.equal(adoptBody.items[0].status, 'adopted');
  assert.equal(adoptBody.items[1].status, 'adopted');

  const semanticGet = await handleGetMedicalEvent(
    new Request(
      `${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}/${adoptBody.items[0].resourceId}`,
      { headers: authHeaders(accountId) },
    ),
    adoptBody.items[0].resourceId,
  );
  const legacyGet = await handleGetMedicalEvent(
    new Request(
      `${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}/${adoptBody.items[1].resourceId}`,
      { headers: authHeaders(accountId) },
    ),
    adoptBody.items[1].resourceId,
  );
  assert.deepEqual((await semanticGet.json()).event, semanticEvent);
  const persistedLegacy = (await legacyGet.json()).event;
  assert.deepEqual(persistedLegacy, legacyEvent);
  assert.equal(Object.hasOwn(persistedLegacy, 'preparationId'), false);
});
