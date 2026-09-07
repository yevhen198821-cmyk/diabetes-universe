import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

import {
  handleListMedicalEvents,
  setMedicalApiRateLimiterForTests,
} from './medical-events-handlers.ts';
import { MEDICAL_EVENTS_BASE_PATH } from './constants.ts';
import {
  createEnforcingMedicalApiRateLimiter,
  MemoryMedicalApiRateLimitCounterStore,
} from './medical-api-enforcing-rate-limiter.ts';
import { deriveMedicalApiRateLimitBucketKey } from './medical-api-rate-limit-key.ts';
import {
  createProcessLocalMedicalApiRateLimitAdapter,
  createProductionMedicalApiRateLimitAdapter,
  isMemoryRateLimitBackendForbiddenInProduction,
  resetProcessLocalMedicalApiRateLimitStoreForTests,
} from './medical-api-rate-limit-production-adapter.ts';
import { resolveMedicalApiRateLimitPolicy } from './medical-api-rate-limit-policy.ts';
import {
  registerMedicalApiRateLimitBackendAdapter,
  resetMedicalApiRateLimiterForTests,
} from './medical-api-rate-limit.ts';
import { resetMedicalProductionRuntimeForTests } from './ensure-medical-production-runtime.ts';
import { resetMedicalServiceBundleForTests } from './get-medical-service-bundle.ts';
import { TEST_ACCOUNT_HEADER } from './resolve-medical-api-scope.ts';

process.env.NODE_ENV = 'test';
process.env.MEDICAL_REVISION_TOKEN_SECRET =
  'test-medical-revision-token-secret';
process.env.MEDICAL_LIST_CURSOR_SECRET = 'test-medical-list-cursor-secret';

const BASE_URL = 'http://localhost:3000';

test.afterEach(async () => {
  delete process.env.MEDICAL_RATE_LIMIT_MODE;
  delete process.env.MEDICAL_RATE_LIMIT_BACKEND;
  registerMedicalApiRateLimitBackendAdapter(null);
  resetMedicalApiRateLimiterForTests();
  resetProcessLocalMedicalApiRateLimitStoreForTests();
  setMedicalApiRateLimiterForTests(null);
  resetMedicalProductionRuntimeForTests();
  await resetMedicalServiceBundleForTests();
});

test('production adapter source is not an unconditional allow wrapper', () => {
  const source = readFileSync(
    join(
      dirname(new URL(import.meta.url).pathname),
      'medical-api-rate-limit-production-adapter.ts',
    ),
    'utf8',
  );

  assert.doesNotMatch(
    source,
    /check:\s*\(\)\s*=>\s*\(\{\s*outcome:\s*'allowed'\s*\}\)/,
  );
});

test('Vercel production rejects in-memory backends', () => {
  assert.equal(
    isMemoryRateLimitBackendForbiddenInProduction({
      AUTH_RUNTIME_ENV: 'production',
      MEDICAL_RATE_LIMIT_BACKEND: 'process-local',
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    createProductionMedicalApiRateLimitAdapter({
      MEDICAL_RATE_LIMIT_BACKEND: 'process-local',
      NODE_ENV: 'production',
      VERCEL: '1',
      VERCEL_ENV: 'production',
    }),
    null,
  );
});

test('process-local production adapter is not unconditional allow', async () => {
  const limiter = createProcessLocalMedicalApiRateLimitAdapter();
  const input = {
    accountId: 'acct-enforcing',
    operation: 'read',
    path: '/api/v1/medical/me/diabetes-settings',
  };
  const policy = resolveMedicalApiRateLimitPolicy(input);

  for (let index = 0; index < policy.limit; index += 1) {
    const decision = await limiter.check(input);
    assert.equal(decision.outcome, 'allowed');
  }

  const limited = await limiter.check(input);
  assert.equal(limited.outcome, 'rate_limited');
  assert.ok((limited.retryAfterSeconds ?? 0) >= 1);
});

test('separate accounts do not consume each other quota', async () => {
  const limiter = createEnforcingMedicalApiRateLimiter(
    new MemoryMedicalApiRateLimitCounterStore(),
  );
  const path = '/api/v1/medical/me/medical-events';

  const first = await limiter.check({
    accountId: 'acct-a',
    operation: 'read',
    path,
  });
  const second = await limiter.check({
    accountId: 'acct-b',
    operation: 'read',
    path,
  });

  assert.equal(first.outcome, 'allowed');
  assert.equal(second.outcome, 'allowed');
});

test('medical payload fields do not change the rate-limit key', () => {
  const base = {
    accountId: 'acct-key',
    operation: 'mutation',
    path: '/api/v1/medical/me/medical-events',
  };

  assert.equal(
    deriveMedicalApiRateLimitBucketKey(base),
    deriveMedicalApiRateLimitBucketKey({
      ...base,
      path: '/api/v1/medical/me/medical-events?glucose=9.9&note=secret',
    }),
  );
  assert.match(deriveMedicalApiRateLimitBucketKey(base), /^[a-f0-9]{64}$/);
  assert.equal(deriveMedicalApiRateLimitBucketKey(base).includes('@'), false);
  assert.equal(
    deriveMedicalApiRateLimitBucketKey(base).includes('secret'),
    false,
  );
});

test('backend failure is fail-closed', async () => {
  const limiter = createEnforcingMedicalApiRateLimiter({
    increment: async () => {
      throw new Error('store down');
    },
  });

  const decision = await limiter.check({
    accountId: 'acct-down',
    operation: 'read',
    path: '/api/v1/medical/me/diabetes-settings',
  });

  assert.equal(decision.outcome, 'backend_unavailable');
});

test('concurrent requests near the limit do not overshoot', async () => {
  const limiter = createEnforcingMedicalApiRateLimiter(
    new MemoryMedicalApiRateLimitCounterStore(),
  );
  const input = {
    accountId: 'acct-concurrent',
    operation: 'mutation',
    path: '/api/v1/medical/me/diabetes-settings',
  };
  const policy = resolveMedicalApiRateLimitPolicy(input);
  const total = policy.limit + 8;
  const decisions = await Promise.all(
    Array.from({ length: total }, () => limiter.check(input)),
  );

  const allowed = decisions.filter(
    (decision) => decision.outcome === 'allowed',
  );
  const limited = decisions.filter(
    (decision) => decision.outcome === 'rate_limited',
  );

  assert.equal(allowed.length, policy.limit);
  assert.equal(limited.length, 8);
});

test('requests below the documented limit succeed at the route', async () => {
  const store = new MemoryMedicalApiRateLimitCounterStore();
  setMedicalApiRateLimiterForTests(createEnforcingMedicalApiRateLimiter(store));

  const response = await handleListMedicalEvents(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}`, {
      headers: { [TEST_ACCOUNT_HEADER]: 'acct-under-limit' },
    }),
  );

  assert.equal(response.status, 200);
});

test('unauthenticated requests stay unauthorized and do not skip the limiter gate', async () => {
  setMedicalApiRateLimiterForTests({
    check: () => ({ outcome: 'allowed' }),
  });

  const allowedLimiter = await handleListMedicalEvents(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}`),
  );
  assert.equal(allowedLimiter.status, 401);

  setMedicalApiRateLimiterForTests({
    check: () => ({ outcome: 'backend_unavailable' }),
  });

  const failedLimiter = await handleListMedicalEvents(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}`),
  );
  assert.equal(failedLimiter.status, 401);
  const body = await failedLimiter.json();
  assert.equal(body.error.code, 'AUTH_REQUIRED');
});

test('route-level 429 includes RATE_LIMITED and Retry-After', async () => {
  setMedicalApiRateLimiterForTests({
    check: () => ({ outcome: 'rate_limited', retryAfterSeconds: 60 }),
  });

  const limited = await handleListMedicalEvents(
    new Request(`${BASE_URL}${MEDICAL_EVENTS_BASE_PATH}`, {
      headers: { [TEST_ACCOUNT_HEADER]: 'acct-route-limit' },
    }),
  );

  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('Retry-After'), '60');
  const body = await limited.json();
  assert.equal(body.error.code, 'RATE_LIMITED');
});
