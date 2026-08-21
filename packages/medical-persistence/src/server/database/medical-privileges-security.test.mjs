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

function positionOf(pattern) {
  const match = privilegesSql.match(pattern);
  assert.ok(match?.index !== undefined, `Missing SQL pattern: ${pattern}`);
  return match.index;
}

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

test('maintenance caller final state is schema USAGE plus one EXECUTE grant only', () => {
  const revokeFunctionsPosition = positionOf(
    /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_idempotency_maintenance;/,
  );
  const grantSchemaUsagePosition = positionOf(
    /GRANT USAGE ON SCHEMA medical TO medical_idempotency_maintenance;/,
  );
  const grantExecutePosition = positionOf(
    /GRANT EXECUTE ON FUNCTION medical\.purge_expired_idempotency_records\(integer\)\s+TO medical_idempotency_maintenance;/,
  );

  assert.ok(revokeFunctionsPosition < grantSchemaUsagePosition);
  assert.ok(grantSchemaUsagePosition < grantExecutePosition);

  const sqlAfterExecuteGrant = privilegesSql.slice(grantExecutePosition + 1);
  assert.doesNotMatch(
    sqlAfterExecuteGrant,
    /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM medical_idempotency_maintenance;/,
  );

  assert.doesNotMatch(
    privilegesSql,
    /GRANT (?:SELECT|INSERT|UPDATE|DELETE).*medical_idempotency_maintenance/,
  );
});

test('SECURITY DEFINER function is isolated from PUBLIC and owned by maintenance owner', () => {
  const grantCreatePosition = positionOf(
    /GRANT CREATE ON SCHEMA medical TO medical_maintenance_owner;/,
  );
  const ownerTransferPosition = positionOf(
    /OWNER TO medical_maintenance_owner/,
  );
  const revokeCreatePosition = positionOf(
    /REVOKE CREATE ON SCHEMA medical FROM medical_maintenance_owner;/,
  );

  assert.ok(grantCreatePosition < ownerTransferPosition);
  assert.ok(ownerTransferPosition < revokeCreatePosition);
  assert.match(
    privilegesSql,
    /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM PUBLIC;/,
  );
  assert.match(
    foundationSql,
    /REVOKE ALL ON FUNCTION medical\.purge_expired_idempotency_records\(integer\) FROM PUBLIC;/,
  );
});

test('maintenance owner has only schema usage plus SELECT and DELETE on idempotency table', () => {
  assert.match(
    privilegesSql,
    /GRANT USAGE ON SCHEMA medical TO medical_maintenance_owner;/,
  );
  assert.match(
    privilegesSql,
    /GRANT SELECT, DELETE ON TABLE medical\.medical_idempotency_records\s+TO medical_maintenance_owner;/,
  );
  assert.doesNotMatch(
    privilegesSql,
    /GRANT (?:SELECT|INSERT|UPDATE|DELETE).*medical\.(?!medical_idempotency_records)[a-z_]+.*medical_maintenance_owner/,
  );
  assert.doesNotMatch(
    privilegesSql,
    /GRANT (?:INSERT|UPDATE) ON TABLE medical\.medical_idempotency_records\s+TO medical_maintenance_owner/,
  );
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

test('PUBLIC remains locked down for medical schema objects', () => {
  assert.match(privilegesSql, /REVOKE ALL ON SCHEMA medical FROM PUBLIC;/);
  assert.match(
    privilegesSql,
    /REVOKE ALL ON ALL TABLES IN SCHEMA medical FROM PUBLIC;/,
  );
  assert.match(
    privilegesSql,
    /REVOKE ALL ON ALL FUNCTIONS IN SCHEMA medical FROM PUBLIC;/,
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
