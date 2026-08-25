import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { resolveAuthEnvironment } from '../../config/auth-environment.ts';
import { user } from '../database/auth-schema.ts';
import { createUserAvatarRepository } from './user-avatar-repository.ts';
import {
  closeAuthDatabase,
  createAuthDatabase,
} from '../database/create-auth-database.ts';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));
const samplePng = readFileSync(
  join(
    currentDirectory,
    '../../../../../apps/web/e2e/fixtures/profile-avatar-sample.png',
  ),
);

test('user avatar repository persists processed webp bytes in auth database', async () => {
  const environment = resolveAuthEnvironment({
    AUTH_DATABASE_MODE: 'pglite',
    BETTER_AUTH_SECRET: 'test-secret-should-be-at-least-32-characters',
    BETTER_AUTH_URL: 'http://localhost:3000',
  });
  const database = await createAuthDatabase(environment);
  const repository = createUserAvatarRepository(database);
  const updatedAt = new Date();

  await database.insert(user).values({
    accountId: 'acc-avatar-test',
    createdAt: updatedAt,
    email: 'avatar-test@example.com',
    emailVerified: true,
    id: 'user-avatar-test',
    name: 'Avatar Test',
    updatedAt,
  });

  await repository.upsertForUser({
    byteSize: samplePng.byteLength,
    content: samplePng,
    contentType: 'image/webp',
    updatedAt,
    userId: 'user-avatar-test',
  });

  const stored = await repository.getForUser('user-avatar-test');

  assert.ok(stored);
  assert.equal(stored.contentType, 'image/webp');
  assert.equal(stored.byteSize, samplePng.byteLength);
  assert.ok(stored.content.equals(samplePng));

  await repository.deleteForUser('user-avatar-test');
  assert.equal(await repository.getForUser('user-avatar-test'), null);

  await closeAuthDatabase();
});
