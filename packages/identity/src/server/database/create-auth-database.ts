import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { AuthEnvironment } from '../../config/auth-environment';
import { shouldAutoMigrateAuthSchema } from '../../config/auth-runtime-guards';
import { AUTH_FOUNDATION_MIGRATION_SQL } from './auth-foundation-migration';
import { authSchema } from './auth-schema';

export type AuthDatabase =
  PgliteDatabase<typeof authSchema> | PostgresJsDatabase<typeof authSchema>;

type AuthDatabaseGlobal = typeof globalThis & {
  __duAuthPgliteClient?: PGlite | null;
  __duAuthPgliteMigrationPromise?: Promise<void> | null;
  __duAuthPostgresClient?: ReturnType<typeof postgres> | null;
};

function readAuthDatabaseGlobal(): AuthDatabaseGlobal {
  return globalThis as AuthDatabaseGlobal;
}

async function ensurePgliteAuthSchema(pgliteClient: PGlite): Promise<void> {
  const global = readAuthDatabaseGlobal();

  if (!global.__duAuthPgliteMigrationPromise) {
    global.__duAuthPgliteMigrationPromise = pgliteClient
      .exec(AUTH_FOUNDATION_MIGRATION_SQL)
      .then(() => undefined);
  }

  await global.__duAuthPgliteMigrationPromise;
}

export async function createAuthDatabase(
  environment: AuthEnvironment,
): Promise<AuthDatabase> {
  const global = readAuthDatabaseGlobal();

  if (environment.databaseMode === 'pglite') {
    if (!global.__duAuthPgliteClient) {
      const dataDir = process.env.AUTH_PGLITE_DATA_DIR?.trim();
      global.__duAuthPgliteClient = dataDir
        ? new PGlite(dataDir)
        : new PGlite();
    }

    const database = drizzlePglite(global.__duAuthPgliteClient, {
      schema: authSchema,
    });

    if (shouldAutoMigrateAuthSchema(environment.databaseMode)) {
      await ensurePgliteAuthSchema(global.__duAuthPgliteClient);
    }

    return database;
  }

  if (!global.__duAuthPostgresClient) {
    global.__duAuthPostgresClient = postgres(environment.databaseUrl!, {
      max: 10,
      prepare: false,
    });
  }

  return drizzlePostgres(global.__duAuthPostgresClient, { schema: authSchema });
}

export async function closeAuthDatabase(): Promise<void> {
  const global = readAuthDatabaseGlobal();

  if (global.__duAuthPostgresClient) {
    await global.__duAuthPostgresClient.end();
    global.__duAuthPostgresClient = null;
  }

  if (global.__duAuthPgliteClient) {
    await global.__duAuthPgliteClient.close();
    global.__duAuthPgliteClient = null;
  }

  global.__duAuthPgliteMigrationPromise = null;
}
