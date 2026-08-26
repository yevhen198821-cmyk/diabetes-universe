import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { MedicalEnvironment } from '../config/medical-environment';
import {
  MEDICAL_ADOPTION_ITEM_STATES_MIGRATION_SQL,
  MEDICAL_ADOPTION_MIGRATION_SQL,
  MEDICAL_ADOPTION_SUBJECT_RESOURCE_FK_MIGRATION_SQL,
  MEDICAL_DIABETES_SETTINGS_MIGRATION_SQL,
  MEDICAL_FOUNDATION_MIGRATION_SQL,
} from '../database/medical-foundation-migration';
import { medicalSchema } from '../database/medical-schema';

export type MedicalDatabase =
  | PgliteDatabase<typeof medicalSchema>
  | PostgresJsDatabase<typeof medicalSchema>;

type MedicalDatabaseGlobal = typeof globalThis & {
  __duMedicalPgliteClient?: PGlite | null;
  __duMedicalPgliteMigrationPromise?: Promise<void> | null;
  __duMedicalPostgresClient?: ReturnType<typeof postgres> | null;
};

function readMedicalDatabaseGlobal(): MedicalDatabaseGlobal {
  return globalThis as MedicalDatabaseGlobal;
}

async function ensurePgliteMedicalSchema(pgliteClient: PGlite): Promise<void> {
  const global = readMedicalDatabaseGlobal();

  if (!global.__duMedicalPgliteMigrationPromise) {
    global.__duMedicalPgliteMigrationPromise = pgliteClient
      .exec(MEDICAL_FOUNDATION_MIGRATION_SQL)
      .then(() => pgliteClient.exec(MEDICAL_ADOPTION_MIGRATION_SQL))
      .then(() =>
        pgliteClient.exec(MEDICAL_ADOPTION_SUBJECT_RESOURCE_FK_MIGRATION_SQL),
      )
      .then(() => pgliteClient.exec(MEDICAL_ADOPTION_ITEM_STATES_MIGRATION_SQL))
      .then(() => pgliteClient.exec(MEDICAL_DIABETES_SETTINGS_MIGRATION_SQL))
      .then(() => undefined);
  }

  await global.__duMedicalPgliteMigrationPromise;
}

export async function createMedicalDatabase(
  environment: MedicalEnvironment,
): Promise<MedicalDatabase> {
  const global = readMedicalDatabaseGlobal();

  if (environment.databaseMode === 'pglite') {
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

  if (!global.__duMedicalPostgresClient) {
    global.__duMedicalPostgresClient = postgres(environment.databaseUrl!, {
      max: 10,
      prepare: false,
    });
  }

  return drizzlePostgres(global.__duMedicalPostgresClient, {
    schema: medicalSchema,
  });
}

export async function closeMedicalDatabase(): Promise<void> {
  const global = readMedicalDatabaseGlobal();

  if (global.__duMedicalPostgresClient) {
    await global.__duMedicalPostgresClient.end();
    global.__duMedicalPostgresClient = null;
  }

  if (global.__duMedicalPgliteClient) {
    await global.__duMedicalPgliteClient.close();
    global.__duMedicalPgliteClient = null;
  }

  global.__duMedicalPgliteMigrationPromise = null;
}
