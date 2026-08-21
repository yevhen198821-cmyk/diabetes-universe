import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMedicalApiRateLimiter,
  isMedicalApiRateLimitProductionReady,
  resetMedicalApiRateLimiterForTests,
  resolveMedicalApiRateLimitMode,
} from './medical-api-rate-limit.ts';

test.afterEach(() => {
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  resetMedicalApiRateLimiterForTests();
});

test('default production mode keeps rate limiting disabled', () => {
  assert.equal(
    resolveMedicalApiRateLimitMode({ NODE_ENV: 'production' }),
    'disabled',
  );
  assert.equal(
    isMedicalApiRateLimitProductionReady({ NODE_ENV: 'production' }),
    false,
  );
});

test('distributed mode without backend is not production ready and fails closed', () => {
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
  assert.equal(decision.allowed, false);
  assert.ok(decision.retryAfterSeconds);
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
