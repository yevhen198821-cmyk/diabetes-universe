import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleAdoptBatch,
  handleCreateAdoptionSession,
  setMedicalApiRateLimiterForTests,
} from './medical-adoption-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import { MEDICAL_ADOPTION_BASE_PATH } from './constants.ts';

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
