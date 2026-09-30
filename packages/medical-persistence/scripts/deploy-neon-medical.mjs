// Operator-only initial installation. Never import from application runtime.
import { randomBytes } from 'node:crypto';
import { open } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import { buildNeonMedicalInstallation } from './neon-medical-installation.mjs';
import { medicalRoleProfile } from './medical-role-profile.mjs';

const adminUrl = process.env.MEDICAL_BOOTSTRAP_DATABASE_URL;
const outputPath = process.env.MEDICAL_BOOTSTRAP_SECRET_FILE;
if (!adminUrl || !outputPath) {
  console.error(
    'Operator database URL and an absolute secret output path are required.',
  );
  process.exit(2);
}
if (!outputPath.startsWith('/'))
  throw new Error('Secret output path must be absolute');
const repository = fileURLToPath(new URL('../../../', import.meta.url));
const outputRelative = relative(repository, resolve(outputPath));
if (!outputRelative.startsWith(`..${sep}`))
  throw new Error('Keep the credential file outside the repository');
const profile = medicalRoleProfile('neon-sql');
const appPassword = randomBytes(36).toString('base64url');
const deployPassword = randomBytes(36).toString('base64url');
function connectionFor(role, password) {
  const url = new URL(adminUrl);
  url.username = role;
  url.password = password;
  return url.toString();
}
const secrets = {
  MEDICAL_DATABASE_URL: connectionFor(profile.medical_app, appPassword),
  MEDICAL_DEPLOYER_DATABASE_URL: connectionFor(
    'medical_deployer',
    deployPassword,
  ),
  MEDICAL_DATABASE_MODE: 'postgres',
  MEDICAL_ROLE_PROFILE: 'neon-sql',
};
const transport = process.env.MEDICAL_SQL_TRANSPORT ?? 'postgres';
if (!['postgres', 'neon-http'].includes(transport))
  throw new Error('Unknown SQL transport');
const client =
  transport === 'neon-http'
    ? neon(adminUrl)
    : postgres(adminUrl, { max: 1, prepare: false, connect_timeout: 10 });
let secretFile;
try {
  // Exclusive creation prevents accidental credential rotation or overwriting a prior run.
  secretFile = await open(outputPath, 'wx', 0o600);
  await secretFile.writeFile(JSON.stringify(secrets, null, 2) + '\n');
  await secretFile.sync();
  const { statements, manifest } = await buildNeonMedicalInstallation({
    appPassword,
    deployPassword,
  });
  if (transport === 'neon-http') {
    await client.transaction(
      statements.map((query) => client.query(query, [])),
    );
  } else {
    await client.begin(async (tx) => {
      for (const statement of statements) await tx.unsafe(statement);
    });
  }
  console.log(
    `Installed ${manifest.length} medical migrations atomically using SQL-created restricted roles. Credentials saved with mode 0600; no Vercel changes made.`,
  );
} catch (error) {
  // Avoid driver error dumps containing SQL literals/passwords or connection parameters.
  const message = String(error.message)
    .replaceAll(appPassword, '[redacted]')
    .replaceAll(deployPassword, '[redacted]')
    .replaceAll(adminUrl, '[redacted]');
  console.error(
    `Medical installation failed (${error.code ?? 'operator-preflight'}): ${message}. Commit was not confirmed; any created credential file is retained. Verify database state before retrying.`,
  );
  process.exitCode = 1;
} finally {
  await secretFile?.close();
  if (transport === 'postgres') await client.end({ timeout: 2 });
}
