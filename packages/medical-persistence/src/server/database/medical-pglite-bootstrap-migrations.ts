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
 * PGlite/local test bootstrap migrations loaded from drizzle/*.sql.
 * SQL is read lazily so production bundles that accidentally include this
 * module do not fail at module evaluation when drizzle files are absent.
 */
export function readMedicalFoundationMigrationSql(): string {
  return readMedicalMigrationSql('0000_medical_foundation.sql');
}

export function readMedicalAdoptionMigrationSql(): string {
  return readMedicalMigrationSql('0002_medical_adoption.sql');
}

export function readMedicalAdoptionSubjectResourceFkMigrationSql(): string {
  return readMedicalMigrationSql(
    '0003_medical_adoption_subject_resource_fk.sql',
  );
}

export function readMedicalAdoptionItemStatesMigrationSql(): string {
  return readMedicalMigrationSql('0004_medical_adoption_item_states.sql');
}

export function readMedicalDiabetesSettingsMigrationSql(): string {
  return readMedicalMigrationSql('0005_medical_diabetes_settings.sql');
}

export function readMedicalPrivilegesMigrationSql(): string {
  return readMedicalMigrationSql('0001_medical_privileges.sql');
}

export function readMedicalAdoptionPrivilegesMigrationSql(): string {
  return readMedicalMigrationSql('0002_medical_adoption_privileges.sql');
}

export function readMedicalAdoptionItemStatesPrivilegesMigrationSql(): string {
  return readMedicalMigrationSql(
    '0004_medical_adoption_item_states_privileges.sql',
  );
}

export function readMedicalDiabetesSettingsPrivilegesMigrationSql(): string {
  return readMedicalMigrationSql(
    '0006_medical_diabetes_settings_privileges.sql',
  );
}
