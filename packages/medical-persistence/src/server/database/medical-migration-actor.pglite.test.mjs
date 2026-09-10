import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';

import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionItemStatesPrivilegesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionPrivilegesMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalDiabetesSettingsMigrationSql,
  readMedicalDiabetesSettingsPrivilegesMigrationSql,
  readMedicalFoundationMigrationSql,
  readMedicalOpsRateLimitMigrationSql,
  readMedicalOpsRateLimitPrivilegesMigrationSql,
  readMedicalPrivilegesMigrationSql,
} from './medical-pglite-bootstrap-migrations.ts';

const REQUIRED_ROLES = [
  'medical_app',
  'medical_outbox_worker',
  'medical_idempotency_maintenance',
  'medical_maintenance_owner',
  'medical_migrator',
  'medical_deployer',
];

const PRODUCTION_MIGRATION_SEQUENCE = [
  readMedicalFoundationMigrationSql,
  readMedicalPrivilegesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionPrivilegesMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionItemStatesPrivilegesMigrationSql,
  readMedicalDiabetesSettingsMigrationSql,
  readMedicalDiabetesSettingsPrivilegesMigrationSql,
  readMedicalOpsRateLimitMigrationSql,
  readMedicalOpsRateLimitPrivilegesMigrationSql,
];

const IDEMPOTENT_PRIVILEGE_SCRIPTS = [
  readMedicalPrivilegesMigrationSql,
  readMedicalAdoptionPrivilegesMigrationSql,
  readMedicalAdoptionItemStatesPrivilegesMigrationSql,
  readMedicalDiabetesSettingsPrivilegesMigrationSql,
  readMedicalOpsRateLimitPrivilegesMigrationSql,
];

async function execSql(client, sql) {
  await client.exec(sql);
}

async function queryOne(client, sql) {
  const result = await client.query(sql);
  return result.rows[0];
}

async function createMedicalRoles(client) {
  for (const roleName of REQUIRED_ROLES) {
    const loginClause =
      roleName === 'medical_app' || roleName === 'medical_deployer'
        ? 'LOGIN'
        : 'NOLOGIN';
    await execSql(client, `CREATE ROLE ${roleName} ${loginClause}`);
  }

  await execSql(client, 'CREATE ROLE neondb_owner LOGIN');
  await execSql(client, 'CREATE ROLE arbitrary_role LOGIN');
  await execSql(client, 'GRANT CREATE ON DATABASE postgres TO medical_deployer');
  await execSql(client, 'GRANT CREATE ON DATABASE postgres TO medical_migrator');
}

async function grantHarnessOwnershipTransfer(client, actor) {
  // PGlite/vanilla PostgreSQL still require membership to ALTER FUNCTION
  // OWNER. Production 0001 no longer asserts or grants this membership.
  // The harness supplies it only for the duration of the ownership transfer.
  await execSql(client, `GRANT medical_maintenance_owner TO ${actor}`);
}

async function revokeHarnessOwnershipTransfer(client, actor) {
  await execSql(client, `REVOKE medical_maintenance_owner FROM ${actor}`);
}

async function applyProductionMigrationSequence(client) {
  for (const readSql of PRODUCTION_MIGRATION_SEQUENCE) {
    await execSql(client, readSql());
  }
}

async function applyIdempotentPrivilegeScripts(client) {
  for (const readSql of IDEMPOTENT_PRIVILEGE_SCRIPTS) {
    await execSql(client, readSql());
  }
}

async function deployAsApprovedActor(client, actor) {
  await grantHarnessOwnershipTransfer(client, actor);
  await execSql(client, `SET ROLE ${actor}`);
  await applyProductionMigrationSequence(client);
  await execSql(client, 'RESET ROLE');
  await revokeHarnessOwnershipTransfer(client, actor);
}

async function readPrivilegeSnapshot(client) {
  return queryOne(
    client,
    `
    SELECT
      has_schema_privilege('medical_app', 'medical', 'USAGE') AS app_schema_usage,
      has_schema_privilege('medical_app', 'medical', 'CREATE') AS app_schema_create,
      has_table_privilege('medical_app', 'medical.medical_subjects', 'SELECT') AS app_subject_select,
      has_table_privilege('medical_app', 'medical.medical_subjects', 'INSERT') AS app_subject_insert,
      has_table_privilege('medical_app', 'medical.medical_subjects', 'UPDATE') AS app_subject_update,
      has_table_privilege('medical_app', 'medical.medical_subjects', 'DELETE') AS app_subject_delete,
      has_table_privilege('medical_app', 'medical.medical_audit_events', 'INSERT') AS app_audit_insert,
      has_table_privilege('medical_app', 'medical.medical_audit_events', 'SELECT') AS app_audit_select,
      has_table_privilege('medical_app', 'medical.medical_outbox_events', 'INSERT') AS app_outbox_insert,
      has_table_privilege('medical_app', 'medical.medical_outbox_events', 'SELECT') AS app_outbox_select,
      has_schema_privilege('medical_app', 'medical_ops', 'USAGE') AS app_ops_usage,
      has_schema_privilege('medical_app', 'medical_ops', 'CREATE') AS app_ops_create,
      has_table_privilege('medical_app', 'medical_ops.rate_limit_windows', 'SELECT') AS app_rate_select,
      has_table_privilege('medical_app', 'medical_ops.rate_limit_windows', 'INSERT') AS app_rate_insert,
      has_table_privilege('medical_app', 'medical_ops.rate_limit_windows', 'UPDATE') AS app_rate_update,
      has_table_privilege('medical_app', 'medical_ops.rate_limit_windows', 'DELETE') AS app_rate_delete,
      has_schema_privilege('public', 'medical', 'USAGE') AS public_medical_usage,
      has_schema_privilege('public', 'medical', 'CREATE') AS public_medical_create,
      has_table_privilege('public', 'medical.medical_subjects', 'SELECT') AS public_subject_select,
      has_function_privilege('public', 'medical.purge_expired_idempotency_records(integer)', 'EXECUTE') AS public_purge_execute,
      has_schema_privilege('public', 'medical_ops', 'USAGE') AS public_ops_usage,
      has_table_privilege('public', 'medical_ops.rate_limit_windows', 'SELECT') AS public_rate_select,
      has_schema_privilege('medical_maintenance_owner', 'medical', 'CREATE') AS owner_schema_create,
      pg_has_role('medical_migrator', 'medical_maintenance_owner', 'SET') AS migrator_can_set_maintenance_owner,
      pg_has_role('medical_deployer', 'medical_maintenance_owner', 'SET') AS deployer_can_set_maintenance_owner
    `,
  );
}

async function readFunctionSecurity(client) {
  return queryOne(
    client,
    `
    SELECT
      r.rolname AS owner_name,
      p.prosecdef AS security_definer,
      p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_roles r ON r.oid = p.proowner
    WHERE n.nspname = 'medical'
      AND p.proname = 'purge_expired_idempotency_records'
    `,
  );
}

async function readRoleLoginFlags(client) {
  const result = await client.query(`
    SELECT rolname, rolcanlogin
    FROM pg_roles
    WHERE rolname IN (
      'medical_app',
      'medical_deployer',
      'medical_maintenance_owner',
      'medical_migrator'
    )
    ORDER BY rolname
  `);
  return Object.fromEntries(
    result.rows.map((row) => [row.rolname, row.rolcanlogin]),
  );
}

async function readObjectOwners(client) {
  return queryOne(
    client,
    `
    SELECT
      (SELECT r.rolname
         FROM pg_namespace n
         JOIN pg_roles r ON r.oid = n.nspowner
        WHERE n.nspname = 'medical') AS medical_schema_owner,
      (SELECT r.rolname
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_roles r ON r.oid = c.relowner
        WHERE n.nspname = 'medical'
          AND c.relname = 'medical_subjects') AS subjects_owner,
      (SELECT r.rolname
         FROM pg_namespace n
         JOIN pg_roles r ON r.oid = n.nspowner
        WHERE n.nspname = 'medical_ops') AS medical_ops_schema_owner
    `,
  );
}

function assertLeastPrivilegeSnapshot(snapshot) {
  assert.equal(snapshot.app_schema_usage, true);
  assert.equal(snapshot.app_schema_create, false);
  assert.equal(snapshot.app_subject_select, true);
  assert.equal(snapshot.app_subject_insert, true);
  assert.equal(snapshot.app_subject_update, true);
  assert.equal(snapshot.app_subject_delete, false);
  assert.equal(snapshot.app_audit_insert, true);
  assert.equal(snapshot.app_audit_select, false);
  assert.equal(snapshot.app_outbox_insert, true);
  assert.equal(snapshot.app_outbox_select, false);
  assert.equal(snapshot.app_ops_usage, true);
  assert.equal(snapshot.app_ops_create, false);
  assert.equal(snapshot.app_rate_select, true);
  assert.equal(snapshot.app_rate_insert, true);
  assert.equal(snapshot.app_rate_update, true);
  assert.equal(snapshot.app_rate_delete, false);
  assert.equal(snapshot.public_medical_usage, false);
  assert.equal(snapshot.public_medical_create, false);
  assert.equal(snapshot.public_subject_select, false);
  assert.equal(snapshot.public_purge_execute, false);
  assert.equal(snapshot.public_ops_usage, false);
  assert.equal(snapshot.public_rate_select, false);
  assert.equal(snapshot.owner_schema_create, false);
  assert.equal(snapshot.migrator_can_set_maintenance_owner, false);
  assert.equal(snapshot.deployer_can_set_maintenance_owner, false);
}

function assertMaintenanceFunction(functionSecurity) {
  assert.equal(functionSecurity.owner_name, 'medical_maintenance_owner');
  assert.equal(functionSecurity.security_definer, true);
  assert.ok(
    Array.isArray(functionSecurity.proconfig) &&
      functionSecurity.proconfig.includes('search_path=medical, pg_temp'),
  );
}

async function assertRejectedMigrationActor(actor) {
  const client = new PGlite();
  try {
    await createMedicalRoles(client);
    await grantHarnessOwnershipTransfer(client, 'medical_deployer');
    await execSql(client, 'SET ROLE medical_deployer');
    await execSql(client, readMedicalFoundationMigrationSql());
    await execSql(client, 'RESET ROLE');
    await execSql(client, `SET ROLE ${actor}`);
    await assert.rejects(
      () => execSql(client, readMedicalPrivilegesMigrationSql()),
      (error) => {
        assert.match(
          String(error.message),
          /approved medical migration actor \(medical_migrator or medical_deployer\)/,
        );
        assert.match(String(error.message), new RegExp(actor));
        return true;
      },
    );
  } finally {
    await client.close();
  }
}

test('medical_deployer can complete the 0000 through 0008 production sequence', async () => {
  const client = new PGlite();
  try {
    await createMedicalRoles(client);
    await deployAsApprovedActor(client, 'medical_deployer');

    const snapshot = await readPrivilegeSnapshot(client);
    assertLeastPrivilegeSnapshot(snapshot);
    assertMaintenanceFunction(await readFunctionSecurity(client));

    const loginFlags = await readRoleLoginFlags(client);
    assert.equal(loginFlags.medical_deployer, true);
    assert.equal(loginFlags.medical_app, true);
    assert.equal(loginFlags.medical_maintenance_owner, false);
    assert.equal(loginFlags.medical_migrator, false);

    const owners = await readObjectOwners(client);
    assert.equal(owners.medical_schema_owner, 'medical_deployer');
    assert.equal(owners.subjects_owner, 'medical_deployer');
    assert.equal(owners.medical_ops_schema_owner, 'medical_deployer');
    assert.notEqual(owners.medical_schema_owner, 'medical_app');
  } finally {
    await client.close();
  }
});

test('medical_migrator remains an accepted full-sequence migration actor', async () => {
  const client = new PGlite();
  try {
    await createMedicalRoles(client);
    await deployAsApprovedActor(client, 'medical_migrator');

    const snapshot = await readPrivilegeSnapshot(client);
    assertLeastPrivilegeSnapshot(snapshot);
    assertMaintenanceFunction(await readFunctionSecurity(client));

    const owners = await readObjectOwners(client);
    assert.equal(owners.medical_schema_owner, 'medical_migrator');
    assert.notEqual(owners.medical_schema_owner, 'medical_app');
  } finally {
    await client.close();
  }
});

test('medical_app is rejected by the migration actor guard', async () => {
  await assertRejectedMigrationActor('medical_app');
});

test('neondb_owner is rejected by the migration actor guard', async () => {
  await assertRejectedMigrationActor('neondb_owner');
});

test('arbitrary roles are rejected by the migration actor guard', async () => {
  await assertRejectedMigrationActor('arbitrary_role');
});

test('privilege scripts remain idempotent and keep medical_app least-privileged', async () => {
  const client = new PGlite();
  try {
    await createMedicalRoles(client);
    await deployAsApprovedActor(client, 'medical_deployer');

    await grantHarnessOwnershipTransfer(client, 'medical_deployer');
    await execSql(client, 'SET ROLE medical_deployer');
    await applyIdempotentPrivilegeScripts(client);
    await applyIdempotentPrivilegeScripts(client);
    await execSql(client, 'RESET ROLE');
    await revokeHarnessOwnershipTransfer(client, 'medical_deployer');

    const snapshot = await readPrivilegeSnapshot(client);
    assertLeastPrivilegeSnapshot(snapshot);
    assertMaintenanceFunction(await readFunctionSecurity(client));
  } finally {
    await client.close();
  }
});
