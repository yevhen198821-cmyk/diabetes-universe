import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const drizzleDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../drizzle',
);

function readMedicalMigrationSql(filename: string): string {
  return readFileSync(join(drizzleDirectory, filename), 'utf8');
}

/**
 * Canonical P9 foundation migration loaded from drizzle/0000_medical_foundation.sql.
 * PGlite bootstrap and production migrator must use this same artifact.
 */
export const MEDICAL_FOUNDATION_MIGRATION_SQL = readMedicalMigrationSql(
  '0000_medical_foundation.sql',
);

/**
 * Production privilege deployment (mandatory after foundation migration).
 * Intentionally not applied during PGlite/local test bootstrap.
 */
export const MEDICAL_PRIVILEGES_MIGRATION_SQL = readMedicalMigrationSql(
  '0001_medical_privileges.sql',
);

export const MEDICAL_ADOPTION_MIGRATION_SQL = readMedicalMigrationSql(
  '0002_medical_adoption.sql',
);

export const MEDICAL_ADOPTION_PRIVILEGES_MIGRATION_SQL =
  readMedicalMigrationSql('0002_medical_adoption_privileges.sql');
