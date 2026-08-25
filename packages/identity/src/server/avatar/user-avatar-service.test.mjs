import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveAuthEnvironment } from '../../config/auth-environment.ts';
import {
  getCapturedMagicLinkEmailForAddress,
  resetCapturedMagicLinkEmail,
} from '../email/capturing-auth-email-delivery.ts';
import {
  closeAuthDatabase,
  createAuthDatabase,
} from '../database/create-auth-database.ts';
import {
  createIdentityService,
  resetIdentityServiceForTests,
} from '../identity-service.ts';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const samplePng = readFileSync(
  join(
    currentDirectory,
    '../../../../../apps/web/e2e/fixtures/profile-avatar-sample.png',
  ),
);

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
    callbackPath: '/account',
    email,
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

async function createAvatarTestContext() {
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
  await closeAuthDatabase();

  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3000',
  });

  const identityService = await createIdentityService({ environment });
  const database = await createAuthDatabase(environment);

  return { database, identityService };
}

test('uploadUserAvatar stores avatar for authenticated user and delete clears it', async () => {
  const { identityService } = await createAvatarTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'avatar-user@example.com',
  );

  const upload = await identityService.uploadUserAvatar({
    fileBytes: samplePng,
    headers,
  });

  assert.equal(upload.ok, true, upload.code ?? 'unknown avatar upload failure');
  assert.match(upload.avatarUrl ?? '', /\/api\/v1\/identity\/me\/avatar\?v=/);

  const stored = await identityService.getUserAvatarForCurrentUser(headers);
  assert.ok(stored);
  assert.equal(stored.contentType, 'image/webp');

  const deleted = await identityService.deleteUserAvatar(headers);
  assert.equal(deleted.ok, true);

  const afterDelete =
    await identityService.getUserAvatarForCurrentUser(headers);
  assert.equal(afterDelete, null);

  await closeAuthDatabase();
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
});

test('uploadUserAvatar rejects oversized and invalid payloads', async () => {
  const { identityService } = await createAvatarTestContext();
  const headers = await signInWithMagicLink(
    identityService,
    'avatar-invalid@example.com',
  );

  const invalid = await identityService.uploadUserAvatar({
    fileBytes: Buffer.from('not-an-image'),
    headers,
  });

  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, 'AVATAR_INVALID_TYPE');

  const oversized = await identityService.uploadUserAvatar({
    fileBytes: Buffer.alloc(5 * 1024 * 1024 + 1, 1),
    headers,
  });

  assert.equal(oversized.ok, false);
  assert.equal(oversized.code, 'AVATAR_TOO_LARGE');

  await closeAuthDatabase();
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
});

test('avatar mutations always bind to the authenticated session user', async () => {
  const { identityService } = await createAvatarTestContext();
  const headersA = await signInWithMagicLink(
    identityService,
    'avatar-user-a@example.com',
  );
  const headersB = await signInWithMagicLink(
    identityService,
    'avatar-user-b@example.com',
  );

  const uploadA = await identityService.uploadUserAvatar({
    fileBytes: samplePng,
    headers: headersA,
  });
  assert.equal(uploadA.ok, true);

  const avatarBBefore =
    await identityService.getUserAvatarForCurrentUser(headersB);
  assert.equal(avatarBBefore, null);

  const uploadB = await identityService.uploadUserAvatar({
    fileBytes: samplePng,
    headers: headersB,
  });
  assert.equal(uploadB.ok, true);
  assert.notEqual(uploadA.avatarUrl, uploadB.avatarUrl);

  const avatarAAfter =
    await identityService.getUserAvatarForCurrentUser(headersA);
  const avatarBAfter =
    await identityService.getUserAvatarForCurrentUser(headersB);

  assert.ok(avatarAAfter);
  assert.ok(avatarBAfter);
  assert.notEqual(uploadA.avatarUrl, uploadB.avatarUrl);

  await closeAuthDatabase();
  resetIdentityServiceForTests();
  resetCapturedMagicLinkEmail();
});
