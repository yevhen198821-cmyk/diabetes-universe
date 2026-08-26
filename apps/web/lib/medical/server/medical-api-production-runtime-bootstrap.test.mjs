import assert from 'node:assert/strict';
import test from 'node:test';

import { handleGetDiabetesSettings } from './medical-diabetes-settings-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { resetMedicalProductionRuntimeForTests } from './ensure-medical-production-runtime.ts';
import {
  registerMedicalApiRateLimitBackendAdapter,
  resetMedicalApiRateLimiterForTests,
} from './medical-api-rate-limit.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';

test.afterEach(async () => {
  delete process.env.MEDICAL_API_PRODUCTION_GATE;
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  delete process.env.MEDICAL_DATABASE_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  resetMedicalProductionRuntimeForTests();
  await resetMedicalServiceBundleForTests();
});

test('production readiness bootstrap registers adapter and serves diabetes settings GET', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';

  const response = await handleGetDiabetesSettings(
    new Request('http://localhost:3000/api/v1/medical/me/diabetes-settings', {
      headers: {
        [TEST_ACCOUNT_HEADER]: 'preview-diabetes-runtime@example.com',
      },
    }),
  );

  assert.notEqual(response.status, 503);
  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.configured, false);
  assert.equal(body.glucoseDisplayUnit, null);
  assert.equal(typeof body.revision, 'string');
  assert.ok(body.revision.length > 0);
});

test('production readiness without distributed config remains blocked before persistence', async () => {
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;

  const response = await handleGetDiabetesSettings(
    new Request('http://localhost:3000/api/v1/medical/me/diabetes-settings', {
      headers: {
        [TEST_ACCOUNT_HEADER]: 'preview-diabetes-blocked@example.com',
      },
    }),
  );

  assert.equal(response.status, 503);
});
