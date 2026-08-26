import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const persistenceServerIndex = fileURLToPath(
  new URL(
    '../../../../../packages/medical-persistence/src/server/index.ts',
    import.meta.url,
  ),
);
const createMedicalDatabasePath = fileURLToPath(
  new URL(
    '../../../../../packages/medical-persistence/src/server/database/create-medical-database.ts',
    import.meta.url,
  ),
);

test('medical persistence server barrel does not export PGlite bootstrap migrations', async () => {
  const source = readFileSync(persistenceServerIndex, 'utf8');

  assert.equal(source.includes('medical-pglite-bootstrap-migrations'), false);
  assert.equal(source.includes('medical-foundation-migration'), false);
  assert.equal(source.includes('MEDICAL_FOUNDATION_MIGRATION_SQL'), false);

  const persistenceServer = await import(persistenceServerIndex);

  assert.equal(typeof persistenceServer.createMedicalDatabase, 'function');
  assert.equal(typeof persistenceServer.resolveMedicalEnvironment, 'function');
  assert.equal('MEDICAL_FOUNDATION_MIGRATION_SQL' in persistenceServer, false);
});

test('production postgres database factory has no static drizzle filesystem bootstrap imports', () => {
  const source = readFileSync(createMedicalDatabasePath, 'utf8');

  assert.equal(source.includes('medical-pglite-bootstrap-migrations'), false);
  assert.equal(source.includes('0000_medical_foundation.sql'), false);
  assert.equal(source.includes('readFileSync'), false);
  assert.equal(source.includes('@electric-sql/pglite'), false);
  assert.match(
    source,
    /await import\(\s*['"]\.\/create-medical-pglite-database['"]\s*\)/,
  );
});

test('PGlite bootstrap migration module does not read drizzle files at import time', async () => {
  const bootstrapModule =
    await import('../../../../../packages/medical-persistence/src/server/database/medical-pglite-bootstrap-migrations.ts');

  assert.equal(
    typeof bootstrapModule.readMedicalFoundationMigrationSql,
    'function',
  );
});

test('production medical environment resolution does not require drizzle SQL files', async () => {
  process.env.NODE_ENV = 'production';
  process.env.MEDICAL_DATABASE_MODE = 'postgres';
  process.env.MEDICAL_DATABASE_URL =
    'postgres://medical_app@example.com:5432/neondb?sslmode=require';
  process.env.MEDICAL_REVISION_TOKEN_SECRET =
    'production-medical-revision-token-secret-value';
  process.env.MEDICAL_LIST_CURSOR_SECRET =
    'production-medical-list-cursor-secret-value';

  const { resolveMedicalEnvironment } = await import(persistenceServerIndex);

  const environment = resolveMedicalEnvironment(process.env);
  assert.equal(environment.databaseMode, 'postgres');
  assert.equal(typeof environment.databaseUrl, 'string');
});
