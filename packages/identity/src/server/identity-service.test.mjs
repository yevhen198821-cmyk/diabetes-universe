import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AuthConfigurationError,
  resolveAuthEnvironment,
} from '../config/auth-environment.ts';
import {
  getLastCapturedMagicLinkEmail,
  resetCapturedMagicLinkEmail,
} from './email/capturing-auth-email-delivery.ts';
import {
  createIdentityService,
  resetIdentityServiceForTests,
} from './identity-service.ts';
import { closeAuthDatabase } from './database/create-auth-database.ts';

test('requestMagicLink returns generic response and captures email in test mode', async () => {
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
  await closeAuthDatabase();

  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3000',
  });

  const identityService = await createIdentityService({ environment });
  const result = await identityService.requestMagicLink({
    callbackPath: '/account',
    email: 'user@example.com',
    headers: new Headers(),
  });

  assert.equal(result.status, 'sent');
  assert.match(result.message, /Если адрес указан верно/);

  const captured = getLastCapturedMagicLinkEmail();
  assert.ok(captured);
  assert.equal(captured.email, 'user@example.com');
  assert.match(captured.url, /magic-link/);

  await closeAuthDatabase();
  resetIdentityServiceForTests();
});

test('createIdentityService accepts postgres when email delivery is configured', async () => {
  resetIdentityServiceForTests();
  await closeAuthDatabase();

  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'postgres',
    AUTH_EMAIL_FROM: 'auth@example.com',
    BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
    BETTER_AUTH_URL: 'https://example.com',
    DATABASE_URL: 'postgres://user:pass@127.0.0.1:1/unused',
    RESEND_API_KEY: 're_test_key',
  });

  const identityService = await createIdentityService({ environment });
  assert.ok(identityService);

  await closeAuthDatabase();
  resetIdentityServiceForTests();
});

test('createIdentityService rejects postgres runtime when email delivery is missing', async () => {
  resetIdentityServiceForTests();
  await closeAuthDatabase();

  assert.throws(
    () =>
      resolveAuthEnvironment({
        AUTH_DATABASE_MODE: 'postgres',
        BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
        BETTER_AUTH_URL: 'https://example.com',
        DATABASE_URL: 'postgres://user:pass@127.0.0.1:1/unused',
      }),
    AuthConfigurationError,
  );

  await assert.rejects(
    async () =>
      createIdentityService({
        environment: {
          appName: 'Diabetes Universe',
          baseUrl: 'https://example.com',
          betterAuthSecret: 'test-secret-should-be-at-least-32-characters',
          cookiePrefix: 'du-auth',
          databaseMode: 'postgres',
          databaseUrl: 'postgres://user:pass@127.0.0.1:1/unused',
          trustedOrigins: ['https://example.com'],
          webauthnRpName: 'Diabetes Universe',
        },
      }),
    AuthConfigurationError,
  );

  await closeAuthDatabase();
  resetIdentityServiceForTests();
});
