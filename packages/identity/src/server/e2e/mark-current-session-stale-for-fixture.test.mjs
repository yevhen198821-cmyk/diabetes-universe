import assert from 'node:assert/strict';
import test from 'node:test';

import { eq } from 'drizzle-orm';

import { resolveAuthEnvironment } from '../../config/auth-environment.ts';
import { session } from '../database/auth-schema.ts';
import {
  closeAuthDatabase,
  createAuthDatabase,
} from '../database/create-auth-database.ts';
import {
  getCapturedMagicLinkEmailForAddress,
  resetCapturedMagicLinkEmail,
} from '../email/capturing-auth-email-delivery.ts';
import {
  createIdentityService,
  resetIdentityServiceForTests,
} from '../identity-service.ts';
import { isSessionFreshForSessionManagement } from '../session-management/session-management-freshness.ts';
import { markCurrentSessionStaleForE2eFixture } from './mark-current-session-stale-for-fixture.ts';

const TEST_SECRET = 'test-secret-should-be-at-least-32-characters';

function createTestEnvironment() {
  return resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: TEST_SECRET,
    BETTER_AUTH_URL: 'http://localhost:3000',
  });
}

function headersFromAuthResponse(response) {
  const headers = new Headers();
  const setCookieValues = response.headers.getSetCookie?.() ?? [];

  if (setCookieValues.length > 0) {
    headers.set(
      'cookie',
      setCookieValues.map((value) => value.split(';')[0]).join('; '),
    );
    return headers;
  }

  const legacySetCookie = response.headers.get('set-cookie');
  if (legacySetCookie) {
    headers.set('cookie', legacySetCookie.split(';')[0]);
  }

  return headers;
}

async function signInWithMagicLink(identityService, email) {
  await identityService.requestMagicLink({
    email,
    callbackPath: '/account',
    headers: new Headers(),
  });

  const captured = getCapturedMagicLinkEmailForAddress(email);
  assert.ok(captured?.url, `magic link missing for ${email}`);

  const response = await identityService.auth.handler(
    new Request(captured.url),
  );
  assert.ok(response.status >= 200 && response.status < 400);

  return headersFromAuthResponse(response);
}

test.afterEach(async () => {
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
  await closeAuthDatabase();
});

test('markCurrentSessionStaleForE2eFixture backdates only the authenticated session', async () => {
  const environment = createTestEnvironment();
  const identityService = await createIdentityService({ environment });
  const database = await createAuthDatabase(environment);
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-e2e-stale-fixture@example.com',
  );
  const current = await identityService.auth.api.getSession({ headers });
  assert.ok(current?.session);

  const result = await markCurrentSessionStaleForE2eFixture(
    identityService,
    environment,
    headers,
  );
  assert.equal(result, 'marked');

  const row = (
    await database
      .select({ createdAt: session.createdAt })
      .from(session)
      .where(eq(session.id, current.session.id))
  )[0];
  assert.ok(row);
  assert.equal(isSessionFreshForSessionManagement(row.createdAt), false);
});

test('markCurrentSessionStaleForE2eFixture returns unauthenticated without a session', async () => {
  const environment = createTestEnvironment();
  const identityService = await createIdentityService({ environment });

  const result = await markCurrentSessionStaleForE2eFixture(
    identityService,
    environment,
    new Headers(),
  );

  assert.equal(result, 'unauthenticated');
});
