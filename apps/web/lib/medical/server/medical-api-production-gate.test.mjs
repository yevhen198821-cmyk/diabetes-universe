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
import {
  getMedicalApiRateLimiter,
  resetMedicalApiRateLimiterForTests,
  setMedicalApiRateLimiterForTests,
} from './medical-api-rate-limit.ts';
import { resetMedicalProductionRuntimeForTests } from './ensure-medical-production-runtime.ts';
import { registerMedicalApiRateLimitBackendAdapter } from './medical-api-runtime-readiness.ts';
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
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  setMedicalApiRateLimiterForTests(null);
  resetMedicalProductionRuntimeForTests();
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

test('production bootstrap auto-registers adapter when distributed backend is configured', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'approved-backend';
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  setMedicalApiRateLimiterForTests(null);
  resetMedicalProductionRuntimeForTests();

  const response = await handleCreateMedicalEvent(
    new Request(medicalEventsUrl(), {
      method: 'POST',
      headers: {
        ...authHeaders('acct-prod-backend-bootstrap'),
        [MEDICAL_IDEMPOTENCY_HEADER]: 'backend-bootstrap',
        'content-type': 'application/json',
      },
      body: sampleCreateBody(),
    }),
  );

  assert.notEqual(response.status, 503);
});

test('production with registered adapter may proceed past readiness gate', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'approved-backend';
  registerMedicalApiRateLimitBackendAdapter({
    check: () => ({ outcome: 'allowed' }),
  });
  resetMedicalApiRateLimiterForTests();
  setMedicalApiRateLimiterForTests(null);

  const response = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders('acct-prod-adapter-ready'),
    }),
  );

  assert.notEqual(response.status, 503);
});

test('removing registered adapter returns production gate to unavailable', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'approved-backend';

  registerMedicalApiRateLimitBackendAdapter({
    check: () => ({ outcome: 'allowed' }),
  });
  resetMedicalApiRateLimiterForTests();

  const allowed = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders('acct-prod-adapter-removed'),
    }),
  );
  assert.notEqual(allowed.status, 503);

  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  await resetMedicalServiceBundleForTests();

  const blocked = await handleListMedicalEvents(
    new Request(medicalEventsUrl(), {
      headers: authHeaders('acct-prod-adapter-removed'),
    }),
  );

  assert.equal(blocked.status, 503);
  assert.equal(getMedicalServiceBundleAccessCountForTests(), 0);
});
