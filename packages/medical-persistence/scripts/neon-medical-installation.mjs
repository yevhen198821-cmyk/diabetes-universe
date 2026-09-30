import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import {
  medicalRoleProfile,
  bindMedicalRoles,
  stripMigrationTransaction,
} from './medical-role-profile.mjs';

export async function buildNeonMedicalInstallation({
  appPassword,
  deployPassword,
}) {
  for (const password of [appPassword, deployPassword]) {
    if (!/^[A-Za-z0-9_-]{48,}$/.test(password))
      throw new Error('Use generated base64url secrets of at least 36 bytes');
  }
  const profile = medicalRoleProfile('neon-sql');
  const roleNames = [...Object.values(profile), 'medical_deployer'];
  const statements = [
    `DO $$ BEGIN
    IF to_regnamespace('medical') IS NOT NULL OR to_regnamespace('medical_ops') IS NOT NULL THEN
      RAISE EXCEPTION 'Initial installer refuses existing medical schemas';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN (${roleNames.map((name) => `'${name}'`).join(',')})) THEN
      RAISE EXCEPTION 'Installation roles already exist; refusing credential rotation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'medical_migrator') THEN
      RAISE EXCEPTION 'Legacy medical_migrator role prerequisite is missing';
    END IF;
  END $$;`,
  ];
  for (const role of roleNames) {
    const password =
      role === profile.medical_app
        ? appPassword
        : role === 'medical_deployer'
          ? deployPassword
          : null;
    statements.push(
      `CREATE ROLE ${role} ${password ? `LOGIN PASSWORD '${password}'` : 'NOLOGIN'} NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;`,
    );
  }
  statements.push(
    "DO $$ BEGIN EXECUTE format('GRANT CREATE ON DATABASE %I TO medical_deployer', current_database()); END $$;",
    'GRANT medical_deployer TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;',
    `GRANT ${profile.medical_maintenance_owner} TO medical_deployer WITH INHERIT FALSE, SET TRUE;`,
    'SET LOCAL ROLE medical_deployer;',
  );
  const directory = new URL('../drizzle/', import.meta.url);
  const files = (await readdir(directory))
    .filter((name) => /^\d{4}[a-z0-9_]*\.sql$/.test(name))
    .sort();
  const manifest = [];
  for (const filename of files) {
    const source = await readFile(new URL(filename, directory), 'utf8');
    const sql = stripMigrationTransaction(bindMedicalRoles(source, profile));
    // Neon HTTP accepts one prepared statement per batch item. SPI executes the
    // canonical migration's statements inside one invoker DO block, in the outer transaction.
    if (sql.includes('$du_install_sql$'))
      throw new Error('Reserved installation delimiter in migration');
    statements.push(
      `DO $du_install_block$ BEGIN EXECUTE $du_install_sql$${sql}$du_install_sql$; END $du_install_block$;`,
    );
    manifest.push({
      filename,
      hash: createHash('sha256').update(source).digest('hex'),
    });
  }
  statements.push(
    'CREATE TABLE medical_ops.deployment_manifest (filename text PRIMARY KEY, source_sha256 text NOT NULL, role_profile text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());',
    `INSERT INTO medical_ops.deployment_manifest (filename, source_sha256, role_profile) VALUES ${manifest.map(({ filename, hash }) => `('${filename}', '${hash}', 'neon-sql')`).join(',')};`,
    'RESET ROLE;',
    `REVOKE ${profile.medical_maintenance_owner} FROM medical_deployer;`,
    // Neon grants creator ADMIN from cloud_admin with INHERIT/SET already false.
    // Remove only the temporary self-granted SET option; retain the creator's
    // ADMIN capability for future rotation and maintenance-owner deployment grants.
    'REVOKE SET OPTION FOR medical_deployer FROM CURRENT_USER;',
  );
  return { statements, manifest };
}
