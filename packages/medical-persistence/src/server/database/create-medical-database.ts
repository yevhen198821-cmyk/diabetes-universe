import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { MedicalEnvironment } from '../config/medical-environment';
import { medicalSchema } from '../database/medical-schema';

import type { MedicalPgliteDatabase } from './create-medical-pglite-database';

export type MedicalDatabase =
  MedicalPgliteDatabase | PostgresJsDatabase<typeof medicalSchema>;

type MedicalDatabaseGlobal = typeof globalThis & {
  __duMedicalPgliteClient?: { close: () => Promise<void> } | null;
  __duMedicalPostgresClient?: ReturnType<typeof postgres> | null;
};

function readMedicalDatabaseGlobal(): MedicalDatabaseGlobal {
  return globalThis as MedicalDatabaseGlobal;
}

export async function createMedicalDatabase(
  environment: MedicalEnvironment,
): Promise<MedicalDatabase> {
  if (environment.databaseMode === 'pglite') {
    const { createMedicalPgliteDatabase } =
      await import('./create-medical-pglite-database');
    return createMedicalPgliteDatabase(environment);
  }

  const global = readMedicalDatabaseGlobal();

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
    const { closeMedicalPgliteDatabase } =
      await import('./create-medical-pglite-database');
    await closeMedicalPgliteDatabase();
  }
}
