import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import type { PgliteDatabase } from 'drizzle-orm/pglite';

import type { MedicalEnvironment } from '../config/medical-environment';
import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalDiabetesSettingsMigrationSql,
  readMedicalFoundationMigrationSql,
} from './medical-pglite-bootstrap-migrations';
import { medicalSchema } from './medical-schema';

export type MedicalPgliteDatabase = PgliteDatabase<typeof medicalSchema>;

type MedicalPgliteGlobal = typeof globalThis & {
  __duMedicalPgliteClient?: PGlite | null;
  __duMedicalPgliteMigrationPromise?: Promise<void> | null;
};

function readMedicalPgliteGlobal(): MedicalPgliteGlobal {
  return globalThis as MedicalPgliteGlobal;
}

async function ensurePgliteMedicalSchema(pgliteClient: PGlite): Promise<void> {
  const global = readMedicalPgliteGlobal();

  if (!global.__duMedicalPgliteMigrationPromise) {
    global.__duMedicalPgliteMigrationPromise = pgliteClient
      .exec(readMedicalFoundationMigrationSql())
      .then(() => pgliteClient.exec(readMedicalAdoptionMigrationSql()))
      .then(() =>
        pgliteClient.exec(readMedicalAdoptionSubjectResourceFkMigrationSql()),
      )
      .then(() =>
        pgliteClient.exec(readMedicalAdoptionItemStatesMigrationSql()),
      )
      .then(() => pgliteClient.exec(readMedicalDiabetesSettingsMigrationSql()))
      .then(() => undefined);
  }

  await global.__duMedicalPgliteMigrationPromise;
}

export async function createMedicalPgliteDatabase(
  _environment: MedicalEnvironment,
): Promise<MedicalPgliteDatabase> {
  const global = readMedicalPgliteGlobal();

  if (!global.__duMedicalPgliteClient) {
    const dataDir = process.env.MEDICAL_PGLITE_DATA_DIR?.trim();
    global.__duMedicalPgliteClient = dataDir
      ? new PGlite(dataDir)
      : new PGlite();
  }

  const database = drizzlePglite(global.__duMedicalPgliteClient, {
    schema: medicalSchema,
  });

  await ensurePgliteMedicalSchema(global.__duMedicalPgliteClient);

  return database;
}

export async function closeMedicalPgliteDatabase(): Promise<void> {
  const global = readMedicalPgliteGlobal();

  if (global.__duMedicalPgliteClient) {
    await global.__duMedicalPgliteClient.close();
    global.__duMedicalPgliteClient = null;
  }

  global.__duMedicalPgliteMigrationPromise = null;
}
