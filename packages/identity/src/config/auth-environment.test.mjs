import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthConfigurationError,
  probeAuthConfiguration,
  resolveAuthEnvironment,
  resolveBetterAuthBaseUrlConfig,
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
    'http://localhost:3000',
    'https://one.example',
    'https://two.example',
  ]);
});

test('resolveAuthEnvironment always trusts the resolved base URL origin', () => {
  const environment = resolveAuthEnvironment({
    ...baseEnv,
    AUTH_TRUSTED_ORIGINS: 'https://production.example',
  });

  assert.deepEqual(environment.trustedOrigins, [
    'http://localhost:3000',
    'https://production.example',
  ]);
});

test('preview deployments prefer branch alias host over immutable deployment host', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    AUTH_WEBAUTHN_ORIGIN: 'https://production.example',
    AUTH_WEBAUTHN_RP_ID: 'production.example',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
    VERCEL_BRANCH_URL:
      'diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'diabetes-universe-web-ft5kujfzn-resulto.vercel.app',
  });

  assert.equal(
    environment.baseUrl,
    'https://diabetes-universe-web-git-implementation-profile-2b7cc9-resulto.vercel.app',
  );
  assert.equal(environment.passkeyEnabled, false);
  assert.equal(environment.databaseMode, 'postgres');
});

test('preview deployments keep magic-link auth when production WebAuthn vars are present', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    AUTH_WEBAUTHN_ORIGIN: 'https://production.example',
    AUTH_WEBAUTHN_RP_ID: 'production.example',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'diabetes-universe-web-git-feature-resulto.vercel.app',
  });

  assert.equal(
    environment.baseUrl,
    'https://diabetes-universe-web-git-feature-resulto.vercel.app',
  );
  assert.equal(environment.passkeyEnabled, false);
  assert.equal(environment.databaseMode, 'postgres');
});

test('preview deployments fall back to VERCEL_URL when branch alias is absent', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'diabetes-universe-web-ft5kujfzn-resulto.vercel.app',
  });

  assert.equal(
    environment.baseUrl,
    'https://diabetes-universe-web-ft5kujfzn-resulto.vercel.app',
  );
});

test('preview deployments expose dynamic Better Auth base URL config', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
    VERCEL_BRANCH_URL: 'preview-branch.vercel.app',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-host.vercel.app',
  });

  assert.deepEqual(
    resolveBetterAuthBaseUrlConfig(environment, {
      VERCEL_ENV: 'preview',
      VERCEL_BRANCH_URL: 'preview-branch.vercel.app',
      VERCEL_URL: 'preview-host.vercel.app',
      BETTER_AUTH_URL: 'https://production.example',
    }),
    {
      allowedHosts: [
        'preview-branch.vercel.app',
        'preview-host.vercel.app',
        'production.example',
      ],
      fallback: 'https://preview-branch.vercel.app',
      protocol: 'https',
    },
  );
});

test('non-preview deployments keep static Better Auth base URL config', () => {
  const environment = resolveAuthEnvironment(baseEnv);

  assert.equal(
    resolveBetterAuthBaseUrlConfig(environment, baseEnv),
    baseEnv.BETTER_AUTH_URL,
  );
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

test('passkeys are disabled when WebAuthn origin does not match the auth base URL', () => {
  const environment = resolveAuthEnvironment({
    ...baseEnv,
    AUTH_WEBAUTHN_ORIGIN: 'https://diabetes.example',
    AUTH_WEBAUTHN_RP_ID: 'diabetes.example',
  });

  assert.equal(environment.passkeyEnabled, false);
  assert.equal(environment.webauthnOrigin, undefined);
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
    resolveSafeAuthCallbackPath('/account/settings'),
    '/account/settings',
  );
  assert.equal(
    resolveSafeAuthCallbackPath('/account/diabetes'),
    '/account/diabetes',
  );
  assert.equal(
    resolveSafeAuthCallbackPath('/account/security'),
    '/account/security',
  );
  assert.equal(
    resolveSafeAuthCallbackPath('/account/security/sessions'),
    '/account/security/sessions',
  );
  assert.equal(resolveSafeAuthCallbackPath('/timeline'), '/timeline');
  assert.equal(resolveSafeAuthCallbackPath('//evil.example'), '/account');
});

test('probeAuthConfiguration identifies missing postgres email delivery', () => {
  const probe = probeAuthConfiguration({
    AUTH_DATABASE_MODE: 'postgres',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://example.com',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-host.vercel.app',
  });

  assert.equal(probe.configured, false);
  assert.equal(probe.failureStage, 'email_delivery');
  assert.match(
    probe.failureMessage ?? '',
    /RESEND_API_KEY and AUTH_EMAIL_FROM/,
  );
  assert.equal(probe.envPresence.RESEND_API_KEY, 'MISSING');
  assert.equal(probe.envPresence.AUTH_EMAIL_FROM, 'MISSING');
  assert.equal(probe.envPresence.DATABASE_URL, 'SET');
});

test('probeAuthConfiguration identifies missing auth database configuration', () => {
  const probe = probeAuthConfiguration({
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://example.com',
    NODE_ENV: 'production',
    VERCEL_ENV: 'preview',
  });

  assert.equal(probe.configured, false);
  assert.equal(probe.failureStage, 'database_mode');
  assert.equal(probe.envPresence.DATABASE_URL, 'MISSING');
});

test('probeAuthConfiguration succeeds for preview postgres auth', () => {
  const probe = probeAuthConfiguration({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://production.example',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
    VERCEL_BRANCH_URL: 'preview-branch.vercel.app',
    VERCEL_ENV: 'preview',
    VERCEL_URL: 'preview-host.vercel.app',
  });

  assert.equal(probe.configured, true);
  assert.equal(probe.failureStage, null);
});
