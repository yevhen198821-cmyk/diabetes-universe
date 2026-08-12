import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import { AUTH_FOUNDATION_MIGRATION_SQL } from '../database/auth-foundation-migration.ts';
import { session, user } from '../database/auth-schema.ts';
import { createOwnedSessionsRepository } from './owned-sessions-repository.ts';
import { runOwnedSessionsRepositoryParityScenarios } from './owned-sessions-repository-parity-scenarios.mjs';

test('owned sessions repository parity on PGlite drizzle adapter', async () => {
  const client = new PGlite();
  await client.exec(AUTH_FOUNDATION_MIGRATION_SQL);
  const database = drizzlePglite(client, {
    schema: { session, user },
  });

  await runOwnedSessionsRepositoryParityScenarios(
    async () => ({
      database,
      repository: createOwnedSessionsRepository(database),
    }),
    'pglite',
  );

  await client.close();
});
