import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertProductionCapableEmailDelivery,
  isAuthE2eFixtureEndpointEnabled,
  isAuthE2eRuntime,
  isCapturingEmailDeliveryAllowed,
  isExplicitAuthTestRuntime,
  isProductionAuthDeployment,
  shouldAutoMigrateAuthSchema,
} from './auth-runtime-guards.ts';
import {
  AuthConfigurationError,
  resolveAuthEnvironment,
} from './auth-environment.ts';

const pgliteE2eEnv = {
  AUTH_DATABASE_MODE: 'pglite',
  AUTH_E2E_FIXTURES: 'true',
  AUTH_RUNTIME_ENV: 'e2e',
  AUTH_USE_PGLITE: 'true',
};

test('isProductionAuthDeployment is true only for explicit production markers', () => {
  assert.equal(isProductionAuthDeployment({ VERCEL_ENV: 'production' }), true);
  assert.equal(
    isProductionAuthDeployment({ AUTH_RUNTIME_ENV: 'production' }),
    true,
  );
  assert.equal(
    isProductionAuthDeployment({
      AUTH_E2E_FIXTURES: 'true',
      NODE_ENV: 'production',
    }),
    false,
  );
});

test('isAuthE2eRuntime requires AUTH_RUNTIME_ENV=e2e', () => {
  assert.equal(isAuthE2eRuntime({ AUTH_RUNTIME_ENV: 'e2e' }), true);
  assert.equal(isAuthE2eRuntime({ AUTH_RUNTIME_ENV: 'production' }), false);
  assert.equal(isAuthE2eRuntime({}), false);
});

test('isExplicitAuthTestRuntime requires pglite or NODE_ENV=test', () => {
  assert.equal(
    isExplicitAuthTestRuntime({ AUTH_DATABASE_MODE: 'pglite' }),
    true,
  );
  assert.equal(isExplicitAuthTestRuntime({ AUTH_USE_PGLITE: 'true' }), true);
  assert.equal(isExplicitAuthTestRuntime({ NODE_ENV: 'test' }), true);
  assert.equal(
    isExplicitAuthTestRuntime({
      AUTH_E2E_FIXTURES: 'true',
      NODE_ENV: 'production',
    }),
    false,
  );
});

test('AUTH_E2E_FIXTURES alone cannot enable the fixture endpoint', () => {
  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      AUTH_DATABASE_MODE: 'pglite',
      AUTH_E2E_FIXTURES: 'true',
      AUTH_USE_PGLITE: 'true',
      NODE_ENV: 'production',
    }),
    false,
  );
});

test('fixture endpoint returns 404 for production runtime', () => {
  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      ...pgliteE2eEnv,
      AUTH_RUNTIME_ENV: 'production',
    }),
    false,
  );

  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      ...pgliteE2eEnv,
      AUTH_RUNTIME_ENV: undefined,
      VERCEL_ENV: 'production',
    }),
    false,
  );
});

test('fixture endpoint returns 404 for preview runtime', () => {
  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      ...pgliteE2eEnv,
      AUTH_RUNTIME_ENV: 'preview',
      VERCEL_ENV: 'preview',
    }),
    false,
  );
});

test('fixture endpoint returns 404 for development runtime', () => {
  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      ...pgliteE2eEnv,
      AUTH_RUNTIME_ENV: 'development',
      VERCEL_ENV: 'development',
    }),
    false,
  );
});

test('fixture endpoint returns 404 when runtime is unspecified', () => {
  assert.equal(
    isAuthE2eFixtureEndpointEnabled({
      AUTH_DATABASE_MODE: 'pglite',
      AUTH_E2E_FIXTURES: 'true',
      AUTH_USE_PGLITE: 'true',
    }),
    false,
  );
});

test('fixture endpoint is enabled only for explicit e2e runtime with fixtures and pglite', () => {
  assert.equal(isAuthE2eFixtureEndpointEnabled(pgliteE2eEnv), true);
});

test('shouldAutoMigrateAuthSchema is pglite-only', () => {
  assert.equal(shouldAutoMigrateAuthSchema('pglite'), true);
  assert.equal(shouldAutoMigrateAuthSchema('postgres'), false);
});

test('postgres auth requires production email delivery configuration', () => {
  const postgresEnvironment = {
    appName: 'Diabetes Universe',
    baseUrl: 'https://example.com',
    betterAuthSecret: 'x'.repeat(32),
    cookiePrefix: 'du-auth',
    databaseMode: 'postgres',
    databaseUrl: 'postgres://user:pass@localhost:5432/app',
    trustedOrigins: ['https://example.com'],
    webauthnRpName: 'Diabetes Universe',
  };

  assert.throws(
    () => assertProductionCapableEmailDelivery(postgresEnvironment),
    AuthConfigurationError,
  );

  assert.throws(
    () =>
      resolveAuthEnvironment({
        AUTH_DATABASE_MODE: 'postgres',
        BETTER_AUTH_SECRET: 'x'.repeat(32),
        BETTER_AUTH_URL: 'https://example.com',
        DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
      }),
    /RESEND_API_KEY and AUTH_EMAIL_FROM/,
  );
});

test('postgres auth accepts configured production email delivery', () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'https://example.com',
    DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
    RESEND_API_KEY: 're_test_key',
  });

  assert.equal(environment.databaseMode, 'postgres');
  assert.equal(environment.emailFrom, 'auth@example.com');
  assert.equal(environment.resendApiKey, 're_test_key');
});

test('capturing email delivery is limited to test runtimes', () => {
  const postgresEnvironment = {
    appName: 'Diabetes Universe',
    baseUrl: 'https://example.com',
    betterAuthSecret: 'x'.repeat(32),
    cookiePrefix: 'du-auth',
    databaseMode: 'postgres',
    databaseUrl: 'postgres://user:pass@localhost:5432/app',
    emailFrom: 'auth@example.com',
    resendApiKey: 're_test_key',
    trustedOrigins: ['https://example.com'],
    webauthnRpName: 'Diabetes Universe',
  };

  assert.equal(
    isCapturingEmailDeliveryAllowed(postgresEnvironment, {
      NODE_ENV: 'production',
    }),
    false,
  );
  assert.equal(
    isCapturingEmailDeliveryAllowed(postgresEnvironment, {
      NODE_ENV: 'test',
    }),
    true,
  );
  assert.equal(
    isCapturingEmailDeliveryAllowed(
      { ...postgresEnvironment, databaseMode: 'pglite' },
      { NODE_ENV: 'production' },
    ),
    true,
  );
});
