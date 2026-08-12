import test from 'node:test';

import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AUTH_FOUNDATION_MIGRATION_SQL } from '../database/auth-foundation-migration.ts';
import { session, user } from '../database/auth-schema.ts';
import { createOwnedSessionsRepository } from './owned-sessions-repository.ts';
import { runOwnedSessionsRepositoryParityScenarios } from './owned-sessions-repository-parity-scenarios.mjs';

const postgresUrl = process.env.AUTH_TEST_POSTGRES_URL?.trim() ?? '';

test(
  'owned sessions repository parity on real PostgreSQL via postgres-js drizzle adapter',
  { skip: postgresUrl.length === 0 },
  async () => {
    const sql = postgres(postgresUrl, { max: 1, prepare: false });
    await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE');
    await sql.unsafe('CREATE SCHEMA public');
    await sql.unsafe(AUTH_FOUNDATION_MIGRATION_SQL);

    const database = drizzlePostgres(sql, {
      schema: { session, user },
    });

    try {
      await runOwnedSessionsRepositoryParityScenarios(
        async () => ({
          database,
          repository: createOwnedSessionsRepository(database),
        }),
        'postgres',
      );
    } finally {
      await sql.end({ timeout: 5 });
    }
  },
);
