import assert from 'node:assert/strict';
import test from 'node:test';

import { handleListMedicalEvents } from './medical-events-handlers.ts';
import { MEDICAL_EVENTS_BASE_PATH } from './constants.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';
import {
  getMedicalApiRateLimiter,
  isMedicalApiRateLimitProductionReady,
  resetMedicalApiRateLimiterForTests,
  resolveMedicalApiRateLimitMode,
} from './medical-api-rate-limit.ts';
import {
  isMedicalApiProductionTrafficAllowed,
  resolveMedicalApiRuntimeCapability,
} from './medical-api-runtime-readiness.ts';

const BASE_URL = 'http://localhost:3000';

test.afterEach(() => {
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  delete process.env.NODE_ENV;
  resetMedicalApiRateLimiterForTests();
});

test('production without distributed backend is unavailable', () => {
  assert.equal(
    resolveMedicalApiRuntimeCapability({
      NODE_ENV: 'production',
    }),
    'UNAVAILABLE_MISSING_RATE_LIMITER',
  );
  assert.equal(
    resolveMedicalApiRuntimeCapability({
      MEDICAL_API_PRODUCTION_GATE: '1',
    }),
    'UNAVAILABLE_MISSING_RATE_LIMITER',
  );
  assert.equal(
    isMedicalApiProductionTrafficAllowed({ NODE_ENV: 'production' }),
    false,
  );
});

test('production with distributed backend configured is available', () => {
  const env = {
    NODE_ENV: 'production',
    MEDICAL_RATE_LIMIT_MODE: 'distributed',
    MEDICAL_RATE_LIMIT_BACKEND: 'redis-cluster',
  };

  assert.equal(resolveMedicalApiRuntimeCapability(env), 'AVAILABLE');
  assert.equal(isMedicalApiProductionTrafficAllowed(env), true);
});

test('development disabled mode is test/dev only', () => {
  assert.equal(
    resolveMedicalApiRuntimeCapability({
      NODE_ENV: 'development',
      MEDICAL_RATE_LIMIT_MODE: 'disabled',
    }),
    'TEST_DEV_ONLY',
  );
  assert.equal(
    isMedicalApiProductionTrafficAllowed({
      NODE_ENV: 'development',
      MEDICAL_RATE_LIMIT_MODE: 'disabled',
    }),
    true,
  );
});

test('test environment with disabled rate limit allows requests', async () => {
  process.env.NODE_ENV = 'test';
  process.env.MEDICAL_RATE_LIMIT_MODE = 'disabled';

  const response = await handleListMedicalEvents(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}`, {
      headers: { [TEST_ACCOUNT_HEADER]: 'acct-dev-disabled' },
    }),
  );

  assert.equal(response.status, 200);
});

test('distributed mode without backend is not production ready', () => {
  const env = {
    NODE_ENV: 'production',
    MEDICAL_RATE_LIMIT_MODE: 'distributed',
  };

  assert.equal(resolveMedicalApiRateLimitMode(env), 'distributed');
  assert.equal(isMedicalApiRateLimitProductionReady(env), false);

  const decision = getMedicalApiRateLimiter(env).check({
    accountId: 'acct-prod',
    operation: 'read',
    path: '/api/v1/medical/me/medical-events',
  });
  assert.equal(decision.outcome, 'rate_limited');
});

test('test mode is available only in NODE_ENV=test', () => {
  assert.equal(
    resolveMedicalApiRateLimitMode({
      NODE_ENV: 'test',
      MEDICAL_RATE_LIMIT_MODE: 'test',
    }),
    'test',
  );
  assert.equal(
    resolveMedicalApiRateLimitMode({
      NODE_ENV: 'production',
      MEDICAL_RATE_LIMIT_MODE: 'test',
    }),
    'distributed',
  );
});
