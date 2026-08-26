import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionItemStatesPrivilegesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionPrivilegesMigrationSql,
  readMedicalDiabetesSettingsPrivilegesMigrationSql,
  readMedicalFoundationMigrationSql,
  readMedicalPrivilegesMigrationSql,
} from '../database/medical-pglite-bootstrap-migrations.ts';

const drizzleDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle',
);

const foundationSql = readFileSync(
  join(drizzleDirectory, '0000_medical_foundation.sql'),
  'utf8',
);
const adoptionSql = readFileSync(
  join(drizzleDirectory, '0002_medical_adoption.sql'),
  'utf8',
);
const adoptionPrivilegesSql = readFileSync(
  join(drizzleDirectory, '0002_medical_adoption_privileges.sql'),
  'utf8',
);
const adoptionItemStatesSql = readFileSync(
  join(drizzleDirectory, '0004_medical_adoption_item_states.sql'),
  'utf8',
);
const adoptionItemStatesPrivilegesSql = readFileSync(
  join(drizzleDirectory, '0004_medical_adoption_item_states_privileges.sql'),
  'utf8',
);
const diabetesSettingsPrivilegesSql = readFileSync(
  join(drizzleDirectory, '0006_medical_diabetes_settings_privileges.sql'),
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
  assert.equal(readMedicalFoundationMigrationSql(), foundationSql);
});

test('PGlite bootstrap loads canonical adoption migration SQL artifact', () => {
  assert.equal(readMedicalAdoptionMigrationSql(), adoptionSql);
});

test('PGlite bootstrap loads canonical adoption item state migration SQL artifact', () => {
  assert.equal(
    readMedicalAdoptionItemStatesMigrationSql(),
    adoptionItemStatesSql,
  );
});

test('adoption item state privilege migration grants table-specific medical_app access', () => {
  assert.equal(
    readMedicalAdoptionItemStatesPrivilegesMigrationSql(),
    adoptionItemStatesPrivilegesSql,
  );
  assert.match(adoptionItemStatesPrivilegesSql, /medical_adoption_item_states/);
  assert.match(adoptionItemStatesPrivilegesSql, /GRANT SELECT, INSERT, UPDATE/);
  assert.doesNotMatch(adoptionItemStatesPrivilegesSql, /GRANT DELETE/);
});

test('diabetes settings privilege migration grants table-specific medical_app access', () => {
  assert.equal(
    readMedicalDiabetesSettingsPrivilegesMigrationSql(),
    diabetesSettingsPrivilegesSql,
  );
  assert.match(diabetesSettingsPrivilegesSql, /diabetes_settings/);
  assert.match(diabetesSettingsPrivilegesSql, /glucose_target_profiles/);
  assert.match(diabetesSettingsPrivilegesSql, /GRANT SELECT, INSERT, UPDATE/);
  assert.doesNotMatch(diabetesSettingsPrivilegesSql, /GRANT DELETE/);
});

test('adoption privilege migration grants table-specific medical_app access', () => {
  assert.equal(
    readMedicalAdoptionPrivilegesMigrationSql(),
    adoptionPrivilegesSql,
  );
  assert.match(adoptionPrivilegesSql, /medical_adoption_sessions/);
  assert.match(adoptionPrivilegesSql, /medical_adoption_mappings/);
  assert.doesNotMatch(adoptionPrivilegesSql, /GRANT ALL/);
});

test('privilege migration SQL is executable and fails closed without Neon roles', () => {
  assert.equal(readMedicalPrivilegesMigrationSql(), privilegesSql);
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

test('production postgres database factory does not import PGlite bootstrap migrations', async () => {
  const productionSource = readFileSync(
    new URL('../database/create-medical-database.ts', import.meta.url),
    'utf8',
  );
  const pgliteSource = readFileSync(
    new URL('../database/create-medical-pglite-database.ts', import.meta.url),
    'utf8',
  );

  assert.equal(
    productionSource.includes('MEDICAL_FOUNDATION_MIGRATION_SQL'),
    false,
  );
  assert.equal(
    productionSource.includes('MEDICAL_ADOPTION_MIGRATION_SQL'),
    false,
  );
  assert.equal(productionSource.includes('@electric-sql/pglite'), false);
  assert.equal(
    productionSource.includes(
      'CREATE TABLE IF NOT EXISTS medical.medical_subjects',
    ),
    false,
  );

  assert.equal(
    pgliteSource.includes('readMedicalFoundationMigrationSql'),
    true,
  );
  assert.equal(pgliteSource.includes('readMedicalAdoptionMigrationSql'), true);
  assert.equal(pgliteSource.includes('@electric-sql/pglite'), true);
});
