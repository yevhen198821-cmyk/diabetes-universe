import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const identityForeignSessionTestSource = readFileSync(
  join(
    currentDirectory,
    '../../../../packages/identity/src/server/identity-service-session-management.test.mjs',
  ),
  'utf8',
);

const actionsSource = readFileSync(
  join(currentDirectory, 'session-management-actions.ts'),
  'utf8',
);

test('cross-account foreign sessionId protection remains identity-owned with safe web action surface', () => {
  assert.match(
    identityForeignSessionTestSource,
    /foreign sessionId cannot revoke another account session/,
  );
  assert.match(actionsSource, /parseRevokeSessionId\(formData\)/);
  assert.match(
    actionsSource,
    /revokeAccountSession\(\{\s*sessionId,\s*headers: await headers\(\),\s*\}\)/,
  );
  assert.doesNotMatch(actionsSource, /userId/);
  assert.doesNotMatch(actionsSource, /accountId/);
});
