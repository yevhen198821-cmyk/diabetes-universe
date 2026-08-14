import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  MEDICAL_FOUNDATION_MIGRATION_SQL,
  MEDICAL_PRIVILEGES_MIGRATION_SQL,
} from '../database/medical-foundation-migration.ts';

const drizzleDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle',
);

const foundationSql = readFileSync(
  join(drizzleDirectory, '0000_medical_foundation.sql'),
  'utf8',
);
const privilegesSql = readFileSync(
  join(drizzleDirectory, '0001_medical_privileges.sql'),
  'utf8',
);

test('PGlite bootstrap loads canonical 0000 migration SQL artifact', () => {
  assert.equal(MEDICAL_FOUNDATION_MIGRATION_SQL, foundationSql);
});

test('privilege migration SQL is executable and fails closed without Neon roles', () => {
  assert.equal(MEDICAL_PRIVILEGES_MIGRATION_SQL, privilegesSql);
  assert.match(privilegesSql, /RAISE EXCEPTION/);
  assert.match(privilegesSql, /medical_app/);
  assert.doesNotMatch(
    privilegesSql,
    /GRANT ALL ON SCHEMA medical TO medical_migrator/,
  );
});

test('medical foundation migration has no auth table foreign keys', () => {
  assert.equal(foundationSql.includes('REFERENCES user'), false);
  assert.equal(foundationSql.includes('ON DELETE CASCADE'), false);
  assert.match(foundationSql, /ON DELETE RESTRICT/);
});

test('medical foundation migration defines reciprocal self uniqueness indexes', () => {
  assert.match(foundationSql, /account_subject_one_active_self/);
  assert.match(foundationSql, /account_subject_one_active_self_subject/);
});

test('purge function revokes PUBLIC execute in foundation migration', () => {
  assert.match(
    foundationSql,
    /REVOKE ALL ON FUNCTION medical\.purge_expired_idempotency_records\(integer\) FROM PUBLIC;/,
  );
});

test('privilege migration grants EXECUTE only to maintenance role', () => {
  assert.match(
    privilegesSql,
    /GRANT EXECUTE ON FUNCTION medical\.purge_expired_idempotency_records\(integer\)\s+TO medical_idempotency_maintenance;/,
  );
  assert.match(privilegesSql, /OWNER TO medical_maintenance_owner/);
});

test('medical_app receives no DELETE and audit/outbox are insert-only', () => {
  assert.doesNotMatch(
    privilegesSql,
    /GRANT DELETE ON TABLE medical\..* TO medical_app/,
  );
  assert.match(
    privilegesSql,
    /GRANT INSERT ON TABLE medical\.medical_audit_events TO medical_app/,
  );
  assert.match(
    privilegesSql,
    /GRANT INSERT ON TABLE medical\.medical_outbox_events TO medical_app/,
  );
  assert.doesNotMatch(
    privilegesSql,
    /GRANT UPDATE ON TABLE medical\.medical_audit_events TO medical_app/,
  );
  assert.doesNotMatch(
    privilegesSql,
    /GRANT UPDATE ON TABLE medical\.medical_outbox_events TO medical_app/,
  );
});

test('maintenance role has no direct table DELETE grant', () => {
  assert.doesNotMatch(
    privilegesSql,
    /GRANT DELETE ON TABLE medical\..* TO medical_idempotency_maintenance/,
  );
});

test('postgres medical database factory does not embed duplicate migration SQL', async () => {
  const source = readFileSync(
    new URL('../database/create-medical-database.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('MEDICAL_FOUNDATION_MIGRATION_SQL'), true);
  assert.equal(source.includes('@electric-sql/pglite'), true);
  assert.equal(
    source.includes('CREATE TABLE IF NOT EXISTS medical.medical_subjects'),
    false,
  );
});
