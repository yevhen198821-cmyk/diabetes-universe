import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { MEDICAL_FOUNDATION_MIGRATION_SQL } from '../database/medical-foundation-migration.ts';

test('medical foundation migration has no auth table foreign keys', () => {
  assert.equal(
    MEDICAL_FOUNDATION_MIGRATION_SQL.includes('REFERENCES user'),
    false,
  );
  assert.equal(
    MEDICAL_FOUNDATION_MIGRATION_SQL.includes('ON DELETE CASCADE'),
    false,
  );
  assert.match(MEDICAL_FOUNDATION_MIGRATION_SQL, /ON DELETE RESTRICT/);
});

test('medical foundation migration defines reciprocal self uniqueness indexes', () => {
  assert.match(
    MEDICAL_FOUNDATION_MIGRATION_SQL,
    /account_subject_one_active_self/,
  );
  assert.match(
    MEDICAL_FOUNDATION_MIGRATION_SQL,
    /account_subject_one_active_self_subject/,
  );
});

test('postgres medical database factory does not embed pglite migration SQL', async () => {
  const source = readFileSync(
    new URL('../database/create-medical-database.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('MEDICAL_FOUNDATION_MIGRATION_SQL'), true);
  assert.equal(source.includes('@electric-sql/pglite'), true);
});
