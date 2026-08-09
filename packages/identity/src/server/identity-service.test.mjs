import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveAuthEnvironment } from '../config/auth-environment.ts';
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
