import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

import { createEnforcingMedicalApiRateLimiter } from './medical-api-enforcing-rate-limiter.ts';
import {
  MEDICAL_API_RATE_LIMIT_WINDOWS_SQL,
  createPostgresMedicalApiRateLimitCounterStore,
} from './medical-api-rate-limit-postgres-store.ts';

test('postgres increment is an atomic upsert and does not create schema at request time', () => {
  const source = readFileSync(
    join(
      dirname(new URL(import.meta.url).pathname),
      'medical-api-rate-limit-postgres-store.ts',
    ),
    'utf8',
  );

  assert.match(source, /ON CONFLICT \(bucket_key, window_start\)/);
  assert.match(source, /request_count \+ 1/);
  assert.doesNotMatch(
    source,
    /await ensureReady\(\)|unsafe\(MEDICAL_API_RATE_LIMIT_WINDOWS_SQL\)/,
  );
  assert.match(
    MEDICAL_API_RATE_LIMIT_WINDOWS_SQL,
    /medical_ops\.rate_limit_windows/,
  );
});

test('postgres store fail-closed path surfaces backend_unavailable', async () => {
  const sql = Object.assign(
    async () => {
      throw new Error('database unavailable');
    },
    {
      unsafe: async () => {
        throw new Error('schema bootstrap must not run on the request path');
      },
    },
  );
  const limiter = createEnforcingMedicalApiRateLimiter(
    createPostgresMedicalApiRateLimitCounterStore({ sql }),
  );

  const decision = await limiter.check({
    accountId: 'acct-pg-down',
    operation: 'read',
    path: '/api/v1/medical/me/diabetes-settings',
  });

  assert.equal(decision.outcome, 'backend_unavailable');
});

test('postgres store counts returned rows and can rate-limit', async () => {
  let nextCount = 0;
  const sql = Object.assign(
    async () => {
      nextCount += 1;
      return [{ request_count: nextCount }];
    },
    {
      unsafe: async () => undefined,
    },
  );
  const limiter = createEnforcingMedicalApiRateLimiter(
    createPostgresMedicalApiRateLimitCounterStore({ sql }),
    { now: () => 1_700_000_000_000 },
  );
  const input = {
    accountId: 'acct-pg-ok',
    operation: 'mutation',
    path: '/api/v1/medical/me/diabetes-settings',
  };

  const first = await limiter.check(input);
  assert.equal(first.outcome, 'allowed');
});
