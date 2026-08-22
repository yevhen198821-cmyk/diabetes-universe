import assert from 'node:assert/strict';
import test from 'node:test';

import {
  handleCreateMedicalEvent,
  handleListMedicalEvents,
} from './medical-events-handlers.ts';
import {
  getMedicalServiceBundleAccessCountForTests,
  resetMedicalServiceBundleForTests,
} from './get-medical-service-bundle.ts';
import { setMedicalApiRateLimiterForTests } from './medical-events-handlers.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
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
  return { [TEST_ACCOUNT_HEADER]: accountId };
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

test.afterEach(async () => {
  delete process.env.MEDICAL_API_PRODUCTION_GATE;
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  delete process.env.MEDICAL_DATABASE_MODE;
  process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  setMedicalApiRateLimiterForTests(null);
  await resetMedicalServiceBundleForTests();
});

test('production without rate-limit config returns 503 before persistence', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;

  const response = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-prod-gate'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'prod-gate-key',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
  assert.equal(getMedicalServiceBundleAccessCountForTests(), 0);
  assert.doesNotMatch(JSON.stringify(body), /MEDICAL_RATE_LIMIT/i);
  assert.doesNotMatch(JSON.stringify(body), /glucose/i);
});

test('production with incomplete distributed config returns 503 before persistence', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;

  const response = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders('acct-prod-incomplete'),
    }),
  );

  assert.equal(response.status, 503);
  assert.equal(getMedicalServiceBundleAccessCountForTests(), 0);
});

test('production with configured backend but no adapter returns 503 from limiter', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'approved-backend';
  setMedicalApiRateLimiterForTests(null);

  const response = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-prod-backend-missing-adapter'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'backend-missing-adapter',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, 'SERVICE_UNAVAILABLE');
  assert.doesNotMatch(JSON.stringify(body), /approved-backend/i);
});
