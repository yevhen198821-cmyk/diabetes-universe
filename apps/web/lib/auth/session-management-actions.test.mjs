import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const actionsSource = readFileSync(
  join(currentDirectory, 'session-management-actions.ts'),
  'utf8',
);

test('revokeAccountSessionAction passes only sessionId to identity revoke', () => {
  assert.match(actionsSource, /parseRevokeSessionId\(formData\)/);
  assert.match(
    actionsSource,
    /revokeAccountSession\(\{\s*sessionId,\s*headers: await headers\(\),\s*\}\)/,
  );
  assert.doesNotMatch(actionsSource, /userId/);
  assert.doesNotMatch(actionsSource, /accountId/);
  assert.doesNotMatch(actionsSource, /token/);
});

test('revoke other and revoke all actions do not accept client identifiers', () => {
  assert.match(
    actionsSource,
    /revokeOtherAccountSessions\(\s*await headers\(\),\s*\)/,
  );
  assert.match(
    actionsSource,
    /revokeAllAccountSessions\(\s*await headers\(\),\s*\)/,
  );
  assert.doesNotMatch(actionsSource, /formData\.get\('sessionId'\)/g);
});

test('successful revoke mutations revalidate sessions route only', () => {
  assert.match(actionsSource, /revalidatePath\(outcome\.revalidatePath\)/);
  assert.match(actionsSource, /revalidateOnSuccess: true/);
  assert.doesNotMatch(actionsSource, /result\.sessions/);
});

test('reauthenticateForSessionsAction signs out then redirects with sessions callback', () => {
  assert.match(actionsSource, /signOutCurrentSession\(await headers\(\)\)/);
  assert.match(
    actionsSource,
    /redirect\(ACCOUNT_SECURITY_SESSIONS_AUTH_CALLBACK\)/,
  );
});

test('revoke all success redirects to auth', () => {
  assert.match(actionsSource, /redirect\('\/auth'\)/);
});

test('session management actions do not import auth database or Better Auth internals', () => {
  assert.doesNotMatch(actionsSource, /@diabetes-universe\/identity\/server/);
  assert.doesNotMatch(actionsSource, /better-auth/);
  assert.doesNotMatch(actionsSource, /drizzle/);
  assert.doesNotMatch(actionsSource, /postgres/);
});
