import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthConfigurationError,
  resolveAuthEnvironment,
  resolveSafeAuthCallbackPath,
} from './auth-environment.ts';

const baseEnv = {
  AUTH_DATABASE_MODE: 'pglite',
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
};

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
  const environment = resolveAuthEnvironment(baseEnv);

  assert.equal(environment.databaseMode, 'pglite');
  assert.equal(environment.baseUrl, 'http://localhost:3000');
  assert.equal(environment.passkeyEnabled, false);
});

test('resolveAuthEnvironment reads trusted origins from supplied env', () => {
  const environment = resolveAuthEnvironment({
    ...baseEnv,
    AUTH_TRUSTED_ORIGINS: 'https://one.example, https://two.example',
  });

  assert.deepEqual(environment.trustedOrigins, [
    'https://one.example',
    'https://two.example',
  ]);
});

test('passkeys require both explicit origin and RP ID', () => {
  assert.throws(
    () =>
      resolveAuthEnvironment({
        ...baseEnv,
        AUTH_WEBAUTHN_ORIGIN: 'http://localhost:3000',
      }),
    AuthConfigurationError,
  );
});

test('passkeys accept explicit localhost WebAuthn configuration', () => {
  const environment = resolveAuthEnvironment({
    ...baseEnv,
    AUTH_WEBAUTHN_ORIGIN: 'http://localhost:3000',
    AUTH_WEBAUTHN_RP_ID: 'localhost',
  });

  assert.equal(environment.passkeyEnabled, true);
  assert.equal(environment.webauthnOrigin, 'http://localhost:3000');
  assert.equal(environment.webauthnRpId, 'localhost');
});

test('passkeys reject mismatched preview/production origin configuration', () => {
  assert.throws(
    () =>
      resolveAuthEnvironment({
        ...baseEnv,
        AUTH_WEBAUTHN_ORIGIN: 'https://diabetes.example',
        AUTH_WEBAUTHN_RP_ID: 'diabetes.example',
      }),
    AuthConfigurationError,
  );
});

test('passkeys reject insecure non-localhost origins', () => {
  assert.throws(
    () =>
      resolveAuthEnvironment({
        ...baseEnv,
        BETTER_AUTH_URL: 'http://diabetes.example',
        AUTH_WEBAUTHN_ORIGIN: 'http://diabetes.example',
        AUTH_WEBAUTHN_RP_ID: 'diabetes.example',
      }),
    AuthConfigurationError,
  );
});

test('passkeys reject RP IDs outside the configured origin domain', () => {
  assert.throws(
    () =>
      resolveAuthEnvironment({
        ...baseEnv,
        BETTER_AUTH_URL: 'https://app.diabetes.example',
        AUTH_WEBAUTHN_ORIGIN: 'https://app.diabetes.example',
        AUTH_WEBAUTHN_RP_ID: 'evil.example',
      }),
    AuthConfigurationError,
  );
});

test('resolveSafeAuthCallbackPath rejects external redirects', () => {
  assert.equal(
    resolveSafeAuthCallbackPath('https://evil.example/phish'),
    '/account',
  );
  assert.equal(resolveSafeAuthCallbackPath('/account'), '/account');
  assert.equal(
    resolveSafeAuthCallbackPath('/account/security/sessions'),
    '/account/security/sessions',
  );
  assert.equal(resolveSafeAuthCallbackPath('/timeline'), '/timeline');
  assert.equal(resolveSafeAuthCallbackPath('//evil.example'), '/account');
});
