import assert from 'node:assert/strict';
import test from 'node:test';

import { handleGetDiabetesSettings } from './medical-diabetes-settings-handlers.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { resetMedicalProductionRuntimeForTests } from './ensure-medical-production-runtime.ts';
import {
  registerMedicalApiRateLimitBackendAdapter,
  resetMedicalApiRateLimiterForTests,
} from './medical-api-rate-limit.ts';
import {
  resolvePrincipalForRequest,
  setAuthenticatedPrincipalForTests,
  setMedicalApiTestAuthEnvForTests,
  TEST_ACCOUNT_HEADER,
} from './resolve-medical-api-scope.ts';

process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';

const SETTINGS_URL =
  'http://localhost:3000/api/v1/medical/me/diabetes-settings';

test.afterEach(async () => {
  setMedicalApiTestAuthEnvForTests(null);
  setAuthenticatedPrincipalForTests(undefined);
  delete process.env.MEDICAL_API_PRODUCTION_GATE;
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  delete process.env.MEDICAL_DATABASE_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  delete process.env.VERCEL_ENV;
  delete process.env.AUTH_RUNTIME_ENV;
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  resetMedicalProductionRuntimeForTests();
  await resetMedicalServiceBundleForTests();
});

test('production + flag=1 + valid test header does not impersonate', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '1',
    nodeEnv: 'production',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';

  const request = new Request(SETTINGS_URL, {
    headers: {
      [TEST_ACCOUNT_HEADER]: 'victim-account-id',
    },
  });

  assert.equal(resolvePrincipalForRequest(request), undefined);

  const response = await handleGetDiabetesSettings(request);
  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
});

test('production + missing flag + valid test header remains unauthorized', async () => {
  setMedicalApiTestAuthEnvForTests({
    nodeEnv: 'production',
  });
  delete process.env.MEDICAL_API_ENABLE_TEST_AUTH;
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';

  const response = await handleGetDiabetesSettings(
    new Request(SETTINGS_URL, {
      headers: {
        [TEST_ACCOUNT_HEADER]: 'victim-account-id',
      },
    }),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
});

test('production + malformed test header remains unauthorized', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '1',
    nodeEnv: 'production',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';

  const response = await handleGetDiabetesSettings(
    new Request(SETTINGS_URL, {
      headers: {
        [TEST_ACCOUNT_HEADER]: '   ',
      },
    }),
  );

  assert.equal(response.status, 401);
});

test('test runtime still accepts intended test-auth header', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '1',
    nodeEnv: 'test',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';

  const request = new Request(SETTINGS_URL, {
    headers: {
      [TEST_ACCOUNT_HEADER]: 'test-account-id',
    },
  });

  assert.equal(
    resolvePrincipalForRequest(request)?.accountId,
    'test-account-id',
  );

  const response = await handleGetDiabetesSettings(request);
  assert.equal(response.status, 200);
});

test('production + flag=1 ignores test header and uses the real session', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '1',
    nodeEnv: 'production',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';
  setAuthenticatedPrincipalForTests({
    accountId: 'real-session-account',
    avatarUrl: null,
    displayName: 'Real Session',
    email: 'real-session@example.com',
    emailVerified: true,
  });

  const request = new Request(SETTINGS_URL, {
    headers: {
      [TEST_ACCOUNT_HEADER]: 'victim-account-id',
    },
  });

  assert.equal(resolvePrincipalForRequest(request), undefined);

  const response = await handleGetDiabetesSettings(request);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.doesNotMatch(JSON.stringify(body), /victim-account-id/);
});

test('production + flag=0 keeps real session auth and rejects unauthenticated requests', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '0',
    nodeEnv: 'production',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '0';
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  process.env.MEDICAL_DATABASE_MODE = 'pglite';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'distributed';
  process.env.MEDICAL_RATE_LIMIT_BACKEND = 'process-local';

  const unauthenticated = await handleGetDiabetesSettings(
    new Request(SETTINGS_URL),
  );
  assert.equal(unauthenticated.status, 401);

  setAuthenticatedPrincipalForTests({
    accountId: 'real-session-flag-zero',
    avatarUrl: null,
    displayName: 'Real Session',
    email: 'real-session-flag-zero@example.com',
    emailVerified: true,
  });

  const authenticated = await handleGetDiabetesSettings(
    new Request(SETTINGS_URL, {
      headers: {
        [TEST_ACCOUNT_HEADER]: 'victim-account-id',
      },
    }),
  );
  assert.equal(authenticated.status, 200);
});

test('production-like unauthenticated settings GET stays 401 not 503', async () => {
  setMedicalApiTestAuthEnvForTests({
    enableTestAuth: '1',
    nodeEnv: 'production',
  });
  process.env.MEDICAL_API_ENABLE_TEST_AUTH = '1';
  process.env.MEDICAL_API_PRODUCTION_GATE = '1';
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;

  const response = await handleGetDiabetesSettings(
    new Request(SETTINGS_URL, {
      headers: {
        [TEST_ACCOUNT_HEADER]: 'anonymous',
      },
    }),
  );

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
  assert.notEqual(body.error.code, 'SERVICE_UNAVAILABLE');
});
