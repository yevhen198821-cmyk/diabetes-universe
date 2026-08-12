import assert from 'node:assert/strict';
import test from 'node:test';

import { eq } from 'drizzle-orm';

import { resolveAuthEnvironment } from '../config/auth-environment.ts';
import { session } from './database/auth-schema.ts';
import {
  closeAuthDatabase,
  createAuthDatabase,
} from './database/create-auth-database.ts';
import {
  getCapturedMagicLinkEmailForAddress,
  resetCapturedMagicLinkEmail,
} from './email/capturing-auth-email-delivery.ts';
import {
  createIdentityService,
  resetIdentityServiceForTests,
} from './identity-service.ts';

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

function readSessionCookieClearingSetCookies(response) {
  return response.headers.getSetCookie?.() ?? [];
}

function assertSessionCookiesClearedBySetCookie(setCookies) {
  assert.ok(setCookies.length > 0, 'expected signOut Set-Cookie headers');

  const sessionTokenCookie = setCookies.find((value) =>
    value.startsWith('du-auth.session_token='),
  );
  const sessionDataCookie = setCookies.find((value) =>
    value.startsWith('du-auth.session_data='),
  );

  assert.ok(sessionTokenCookie, 'expected du-auth.session_token Set-Cookie');
  assert.ok(sessionDataCookie, 'expected du-auth.session_data Set-Cookie');
  assert.match(sessionTokenCookie, /Max-Age=0/);
  assert.match(sessionDataCookie, /Max-Age=0/);
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
  assert.ok(
    response.status >= 200 && response.status < 400,
    `magic link handler failed for ${email} with status ${response.status}`,
  );

  return headersFromAuthResponse(response);
}

async function createSessionManagementTestContext() {
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
  await closeAuthDatabase();

  const environment = createTestEnvironment();
  const identityService = await createIdentityService({ environment });
  const database = await createAuthDatabase(environment);

  return { identityService, environment, database };
}

async function teardownSessionManagementTestContext() {
  await closeAuthDatabase();
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
}

test('authenticated user sees own active sessions via owned repository read', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-list@example.com',
  );

  const sessions = await identityService.listAccountSessions(headers);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.isCurrentSession, true);
  assert.equal('token' in sessions[0], false);
  assert.equal('userAgent' in sessions[0], false);

  await teardownSessionManagementTestContext();
});

test('expired owned session is omitted from account session list', async () => {
  const { identityService, database } =
    await createSessionManagementTestContext();
  const email = 'p6c-expired@example.com';
  const headers = await signInWithMagicLink(identityService, email);
  const currentSession = await identityService.auth.api.getSession({ headers });
  assert.ok(currentSession?.session);

  await database.insert(session).values({
    id: 'expired-session-id',
    token: 'expired-session-token',
    createdAt: new Date('2026-08-10T12:00:00.000Z'),
    updatedAt: new Date('2026-08-10T12:00:00.000Z'),
    expiresAt: new Date('2026-08-10T13:00:00.000Z'),
    userId: currentSession.user.id,
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
  });

  const sessions = await identityService.listAccountSessions(headers);
  assert.equal(sessions.length, 1);
  assert.equal(sessions[0]?.sessionId, currentSession.session.id);

  await teardownSessionManagementTestContext();
});

test('stale session can list account sessions but cannot revoke', async () => {
  const { identityService, database } =
    await createSessionManagementTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-stale@example.com',
  );
  const currentSession = await identityService.auth.api.getSession({ headers });
  assert.ok(currentSession?.session);

  const staleCreatedAt = new Date('2026-08-10T12:00:00.000Z');
  await database
    .update(session)
    .set({ createdAt: staleCreatedAt, updatedAt: staleCreatedAt })
    .where(eq(session.id, currentSession.session.id));

  const sessions = await identityService.listAccountSessions(headers);
  assert.equal(sessions.length, 1);

  const revokeResult =
    await identityService.revokeOtherAccountSessions(headers);
  assert.equal(revokeResult.ok, false);
  assert.equal(revokeResult.code, 'FRESH_AUTH_REQUIRED');

  await teardownSessionManagementTestContext();
});

test('fresh session can revoke another owned session and preserves current session', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const email = 'p6c-revoke-other@example.com';
  const primaryHeaders = await signInWithMagicLink(identityService, email);
  const secondaryHeaders = await signInWithMagicLink(identityService, email);

  const secondarySession = await identityService.auth.api.getSession({
    headers: secondaryHeaders,
  });
  assert.ok(secondarySession?.session);

  const revokeResult = await identityService.revokeAccountSession({
    sessionId: secondarySession.session.id,
    headers: primaryHeaders,
  });

  assert.equal(revokeResult.ok, true);
  assert.equal(revokeResult.code, 'SUCCESS');
  assert.equal(revokeResult.sessions?.length, 1);
  assert.equal(revokeResult.sessions?.[0]?.isCurrentSession, true);

  const secondaryAfter =
    await identityService.getCurrentPrincipal(secondaryHeaders);
  assert.equal(secondaryAfter, null);

  await teardownSessionManagementTestContext();
});

test('revoke-by-id rejects current session target', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-revoke-current@example.com',
  );
  const currentSession = await identityService.auth.api.getSession({ headers });
  assert.ok(currentSession?.session);

  const result = await identityService.revokeAccountSession({
    sessionId: currentSession.session.id,
    headers,
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'CURRENT_SESSION_REQUIRES_SIGN_OUT');

  await teardownSessionManagementTestContext();
});

test('revoke other sessions preserves current session', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const email = 'p6c-revoke-others@example.com';
  const primaryHeaders = await signInWithMagicLink(identityService, email);
  await signInWithMagicLink(identityService, email);

  const result =
    await identityService.revokeOtherAccountSessions(primaryHeaders);
  assert.equal(result.ok, true);
  assert.equal(result.sessions?.length, 1);
  assert.equal(result.sessions?.[0]?.isCurrentSession, true);

  await teardownSessionManagementTestContext();
});

test('revokeAllAccountSessions deletes all persisted server session rows', async () => {
  const { identityService, database } =
    await createSessionManagementTestContext();
  const email = 'p6c-revoke-all-server@example.com';
  const headers = await signInWithMagicLink(identityService, email);
  const currentSession = await identityService.auth.api.getSession({ headers });
  assert.ok(currentSession?.session);

  const result = await identityService.revokeAllAccountSessions(headers);
  assert.equal(result.ok, true);
  assert.equal(result.code, 'SUCCESS');
  assert.deepEqual(result.sessions, []);

  const persistedSessions = await database
    .select()
    .from(session)
    .where(eq(session.userId, currentSession.user.id));
  assert.equal(persistedSessions.length, 0);

  await teardownSessionManagementTestContext();
});

test('signOut transport clears session cookies via Set-Cookie response headers', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-signout-cookie@example.com',
  );

  const signOutResponse = await identityService.auth.api.signOut({
    headers,
    asResponse: true,
  });

  assertSessionCookiesClearedBySetCookie(
    readSessionCookieClearingSetCookies(signOutResponse),
  );

  await teardownSessionManagementTestContext();
});

test('revokeAllAccountSessions server invalidation alone does not prove cookie cleanup', async () => {
  const { identityService, database } =
    await createSessionManagementTestContext();
  const email = 'p6c-revoke-all-cookie-proof@example.com';
  const headers = await signInWithMagicLink(identityService, email);
  const currentSession = await identityService.auth.api.getSession({ headers });
  assert.ok(currentSession?.session);

  const persistedRow = (
    await database
      .select()
      .from(session)
      .where(eq(session.id, currentSession.session.id))
  )[0];
  assert.ok(persistedRow);

  const result = await identityService.revokeAllAccountSessions(headers);
  assert.equal(result.ok, true);

  const principalAfterRevokeAll =
    await identityService.getCurrentPrincipal(headers);
  assert.equal(principalAfterRevokeAll, null);

  await database.insert(session).values(persistedRow);

  const restoredSession = await identityService.auth.api.getSession({
    headers,
  });
  assert.ok(
    restoredSession?.session,
    'unchanged request cookie still authenticates after server rows are recreated',
  );

  await teardownSessionManagementTestContext();
});

test('duplicate or missing revoke targets complete safely without enumeration', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'p6c-idempotent@example.com',
  );

  const missingResult = await identityService.revokeAccountSession({
    sessionId: 'missing-session-id',
    headers,
  });
  assert.equal(missingResult.ok, true);
  assert.equal(missingResult.code, 'SUCCESS');

  const duplicateResult = await identityService.revokeAccountSession({
    sessionId: 'missing-session-id',
    headers,
  });
  assert.equal(duplicateResult.ok, true);
  assert.equal(duplicateResult.code, 'SUCCESS');
  assert.match(duplicateResult.message, /выполнено|Действие/);

  await teardownSessionManagementTestContext();
});

test('foreign sessionId cannot revoke another account session', async () => {
  const { identityService } = await createSessionManagementTestContext();
  const headersA = await signInWithMagicLink(
    identityService,
    'p6c-account-a@example.com',
  );
  const headersB = await signInWithMagicLink(
    identityService,
    'p6c-account-b@example.com',
  );

  const sessionsB = await identityService.listAccountSessions(headersB);
  const sessionIdB = sessionsB[0]?.sessionId;
  assert.ok(sessionIdB);

  const revokeResult = await identityService.revokeAccountSession({
    sessionId: sessionIdB,
    headers: headersA,
  });
  assert.equal(revokeResult.ok, true);
  assert.equal(revokeResult.code, 'SUCCESS');
  assert.doesNotMatch(revokeResult.message, /foreign|not your|account b/i);

  const principalB = await identityService.getCurrentPrincipal(headersB);
  assert.ok(principalB);
  const sessionsBAfter = await identityService.listAccountSessions(headersB);
  assert.equal(sessionsBAfter.length, 1);
  assert.equal(sessionsBAfter[0]?.sessionId, sessionIdB);

  await teardownSessionManagementTestContext();
});
