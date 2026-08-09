import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthConfigurationError,
  resolveAuthEnvironment,
  resolveSafeAuthCallbackPath,
} from './auth-environment.ts';

test('resolveAuthEnvironment requires BETTER_AUTH_URL and secret', () => {
  assert.throws(
    () =>
      resolveAuthEnvironment({
        BETTER_AUTH_SECRET: 'x'.repeat(32),
      }),
    AuthConfigurationError,
  );
});

test('resolveAuthEnvironment accepts pglite test mode without DATABASE_URL', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3000',
  });

  assert.equal(environment.databaseMode, 'pglite');
  assert.equal(environment.baseUrl, 'http://localhost:3000');
});

test('resolveSafeAuthCallbackPath rejects external redirects', () => {
  assert.equal(
    resolveSafeAuthCallbackPath('https://evil.example/phish'),
    '/account',
  );
  assert.equal(resolveSafeAuthCallbackPath('/account'), '/account');
  assert.equal(resolveSafeAuthCallbackPath('/timeline'), '/timeline');
  assert.equal(resolveSafeAuthCallbackPath('//evil.example'), '/account');
});
