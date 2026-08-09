import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import type { PgliteDatabase } from 'drizzle-orm/pglite';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type { AuthEnvironment } from '../../config/auth-environment';
import { AUTH_FOUNDATION_MIGRATION_SQL } from './auth-foundation-migration';
import { authSchema } from './auth-schema';

export type AuthDatabase =
  PgliteDatabase<typeof authSchema> | PostgresJsDatabase<typeof authSchema>;

let pgliteClient: PGlite | null = null;
let postgresClient: ReturnType<typeof postgres> | null = null;
let migrationPromise: Promise<void> | null = null;

async function ensureAuthSchema(
  environment: AuthEnvironment,
  database: AuthDatabase,
): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = (async () => {
      const migrationSql = AUTH_FOUNDATION_MIGRATION_SQL;

      if (environment.databaseMode === 'pglite') {
        await pgliteClient!.exec(migrationSql);
        return;
      }

      const statements = migrationSql
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await database.execute(`${statement};`);
      }
    })();
  }

  await migrationPromise;
}

export async function createAuthDatabase(
  environment: AuthEnvironment,
): Promise<AuthDatabase> {
  if (environment.databaseMode === 'pglite') {
    if (!pgliteClient) {
      const dataDir = process.env.AUTH_PGLITE_DATA_DIR?.trim();
      pgliteClient = dataDir ? new PGlite(dataDir) : new PGlite();
    }

    const database = drizzlePglite(pgliteClient, { schema: authSchema });
    await ensureAuthSchema(environment, database);
    return database;
  }

  if (!postgresClient) {
    postgresClient = postgres(environment.databaseUrl!, {
      max: 10,
      prepare: false,
    });
  }

  const database = drizzlePostgres(postgresClient, { schema: authSchema });
  await ensureAuthSchema(environment, database);
  return database;
}

export async function closeAuthDatabase(): Promise<void> {
  if (postgresClient) {
    await postgresClient.end();
    postgresClient = null;
  }

  if (pgliteClient) {
    await pgliteClient.close();
    pgliteClient = null;
  }

  migrationPromise = null;
}
