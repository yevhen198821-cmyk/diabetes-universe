import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { shouldAutoMigrateAuthSchema } from '../../config/auth-runtime-guards.ts';
import {
  closeAuthDatabase,
  createAuthDatabase,
} from './create-auth-database.ts';

test('postgres runtime initialization does not auto-migrate auth schema', () => {
  assert.equal(shouldAutoMigrateAuthSchema('postgres'), false);

  const source = readFileSync(
    fileURLToPath(new URL('./create-auth-database.ts', import.meta.url)),
    'utf8',
  );
  const postgresBranch = source.slice(source.indexOf('if (!postgresClient)'));

  assert.doesNotMatch(postgresBranch, /AUTH_FOUNDATION_MIGRATION_SQL/);
  assert.doesNotMatch(postgresBranch, /ensurePgliteAuthSchema/);
});

test('pglite runtime initialization bootstraps auth schema automatically', async () => {
  await closeAuthDatabase();

  const database = await createAuthDatabase({
    appName: 'Diabetes Universe',
    baseUrl: 'http://localhost:3000',
    betterAuthSecret: 'x'.repeat(32),
    cookiePrefix: 'du-auth',
    databaseMode: 'pglite',
    trustedOrigins: ['http://localhost:3000'],
    webauthnRpName: 'Diabetes Universe',
  });

  const result = await database.execute(
    "select table_name from information_schema.tables where table_schema = 'public' and table_name = 'user'",
  );

  assert.equal(result.rows[0]?.table_name, 'user');

  await closeAuthDatabase();
});

test('createAuthDatabase with postgres mode does not require pglite bootstrap', async () => {
  await closeAuthDatabase();

  const database = await createAuthDatabase({
    appName: 'Diabetes Universe',
    baseUrl: 'https://example.com',
    betterAuthSecret: 'x'.repeat(32),
    cookiePrefix: 'du-auth',
    databaseMode: 'postgres',
    databaseUrl: 'postgres://user:pass@127.0.0.1:1/unused',
    trustedOrigins: ['https://example.com'],
    webauthnRpName: 'Diabetes Universe',
  });

  assert.ok(database);

  await closeAuthDatabase();
});
