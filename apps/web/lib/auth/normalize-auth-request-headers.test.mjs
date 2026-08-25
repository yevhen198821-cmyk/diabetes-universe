import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeAuthRequestHeaders } from './normalize-auth-request-headers.ts';

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('normalizeAuthRequestHeaders copies x-forwarded-host to host for proxy requests', () => {
  process.env = {
    ...originalEnv,
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-host.vercel.app',
  };

  const normalized = normalizeAuthRequestHeaders(
    new Headers({
      cookie: 'du-auth.session_token=test',
      'x-forwarded-host': 'preview-host.vercel.app',
      'x-forwarded-proto': 'https',
    }),
  );

  assert.equal(normalized.get('host'), 'preview-host.vercel.app');
  assert.equal(normalized.get('origin'), 'https://preview-host.vercel.app');
  assert.match(normalized.get('cookie') ?? '', /du-auth\.session_token=test/);
});

test('normalizeAuthRequestHeaders preserves existing host and origin headers', () => {
  process.env = {
    ...originalEnv,
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'http://127.0.0.1:3010',
  };

  const normalized = normalizeAuthRequestHeaders(
    new Headers({
      cookie: 'du-auth.session_token=test',
      host: '127.0.0.1:3010',
      origin: 'http://127.0.0.1:3010',
    }),
  );

  assert.equal(normalized.get('host'), '127.0.0.1:3010');
  assert.equal(normalized.get('origin'), 'http://127.0.0.1:3010');
});
