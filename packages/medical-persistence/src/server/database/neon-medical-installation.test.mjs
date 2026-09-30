import assert from 'node:assert/strict';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { buildNeonMedicalInstallation } from '../../../scripts/neon-medical-installation.mjs';
import {
  medicalRoleProfile,
  roleSecurityFailure,
} from '../../../scripts/medical-role-profile.mjs';

const fixturePasswords = {
  appPassword: 'a'.repeat(48),
  deployPassword: 'b'.repeat(48),
};

test('SQL Neon installation retains restricted roles, sync grants and the exact actor guard', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE medical_migrator NOLOGIN; BEGIN;');
    const { statements, manifest } =
      await buildNeonMedicalInstallation(fixturePasswords);
    for (const statement of statements) await db.exec(statement);
    await db.exec('COMMIT;');
    assert.equal(manifest.length, 13);
    const { rows: roles } = await db.query(
      "SELECT rolname, rolcreaterole, rolcreatedb, rolbypassrls, rolsuper FROM pg_roles WHERE rolname LIKE 'du_medical_%' OR rolname='medical_deployer'",
    );
    assert.equal(roles.length, 5);
    for (const role of roles) assert.equal(roleSecurityFailure(role), null);
    const {
      rows: [owner],
    } = await db.query(
      "SELECT pg_has_role('medical_deployer','du_medical_maintenance_owner','SET') AS temporary, pg_has_role('du_medical_app','medical_deployer','SET') AS runtime_deployer",
    );
    assert.equal(owner.temporary, false);
    assert.equal(owner.runtime_deployer, false);
    const {
      rows: [recorded],
    } = await db.query(
      'SELECT count(*)::int AS count FROM medical_ops.deployment_manifest',
    );
    assert.equal(recorded.count, 13);
    await db.exec('BEGIN;');
    await assert.rejects(
      db.exec(statements[0]),
      /refuses existing medical schemas/,
    );
    await db.exec('ROLLBACK;');
    await db.exec('SET SESSION AUTHORIZATION du_medical_app;');
    await db.query('SELECT * FROM medical.sync_changes LIMIT 0');
    await assert.rejects(
      db.exec('CREATE TABLE medical.forbidden(id int)'),
      /permission denied/,
    );
    await assert.rejects(
      db.exec('DELETE FROM medical.medical_subjects WHERE false'),
      /permission denied/,
    );
    await assert.rejects(
      db.query('SELECT * FROM medical.medical_audit_events LIMIT 0'),
      /permission denied/,
    );
    await assert.rejects(
      db.exec('SET ROLE medical_deployer'),
      /permission denied/,
    );
    // A runtime role cannot install a privilege migration, including through the binding profile.
    await assert.rejects(
      db.exec(statements.find((sql) => sql.includes('DO $verify_roles$'))),
      /approved medical migration actor/,
    );
  } finally {
    await db.close();
  }
});

test('failed initial installation rolls back schema and new login roles together', async () => {
  const db = new PGlite();
  try {
    await db.exec('CREATE ROLE medical_migrator NOLOGIN; BEGIN;');
    const { statements } = await buildNeonMedicalInstallation(fixturePasswords);
    for (const statement of statements.slice(0, 11)) await db.exec(statement);
    await assert.rejects(db.exec('SELECT 1 / 0;'), /division by zero/);
    await db.exec('ROLLBACK;');
    const {
      rows: [state],
    } = await db.query(
      "SELECT to_regnamespace('medical') IS NULL AS no_schema, NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'du_medical_app') AS no_role",
    );
    assert.deepEqual(state, { no_schema: true, no_role: true });
  } finally {
    await db.close();
  }
});

test('preflight rejects both administrative flags and indirect provider authority', () => {
  const role = {
    rolname: 'du_medical_app',
    rolsuper: false,
    rolcreaterole: false,
    rolcreatedb: false,
    rolbypassrls: false,
    can_assume_privileged_role: false,
  };
  assert.equal(roleSecurityFailure(role), null);
  for (const flag of [
    'rolsuper',
    'rolcreaterole',
    'rolcreatedb',
    'rolbypassrls',
    'can_assume_privileged_role',
  ]) {
    assert.ok(roleSecurityFailure({ ...role, [flag]: true }));
  }
  assert.throws(() => medicalRoleProfile('arbitrary-role-prefix'), /Unknown/);
});
