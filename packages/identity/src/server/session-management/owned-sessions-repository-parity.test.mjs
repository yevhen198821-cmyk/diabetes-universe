import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AUTH_FOUNDATION_MIGRATION_SQL } from '../database/auth-foundation-migration.ts';
import { session, user } from '../database/auth-schema.ts';
import { createOwnedSessionsRepository } from './owned-sessions-repository.ts';

async function seedOwnedSessionScenario(database) {
  const now = new Date('2026-08-11T12:00:00.000Z');
  const userId = randomUUID();
  const ownedSessionId = randomUUID();
  const foreignSessionId = randomUUID();
  const foreignUserId = randomUUID();
  const ownedToken = `token-owned-${randomUUID()}`;
  const foreignToken = `token-foreign-${randomUUID()}`;
  const expiredSessionId = randomUUID();

  await database.insert(user).values([
    {
      id: userId,
      name: 'Owner',
      email: `owner-${userId}@example.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      accountId: randomUUID(),
    },
    {
      id: foreignUserId,
      name: 'Foreign',
      email: `foreign-${foreignUserId}@example.com`,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      accountId: randomUUID(),
    },
  ]);

  await database.insert(session).values([
    {
      id: ownedSessionId,
      token: ownedToken,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date('2026-08-18T12:00:00.000Z'),
      userId,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
      ipAddress: '127.0.0.1',
    },
    {
      id: foreignSessionId,
      token: foreignToken,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date('2026-08-18T12:00:00.000Z'),
      userId: foreignUserId,
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.2',
    },
    {
      id: expiredSessionId,
      token: `token-expired-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date('2026-08-10T12:00:00.000Z'),
      userId,
      userAgent: 'Mozilla/5.0',
      ipAddress: '127.0.0.3',
    },
  ]);

  return {
    userId,
    foreignUserId,
    ownedSessionId,
    foreignSessionId,
    ownedToken,
    foreignToken,
    expiredSessionId,
    now,
  };
}

export async function runOwnedSessionsRepositoryParityScenarios(
  createRepository,
  label,
) {
  const { database, repository } = await createRepository();
  const scenario = await seedOwnedSessionScenario(database);

  const activeSessions = await repository.listActiveSessions(
    scenario.userId,
    scenario.now,
  );
  assert.equal(activeSessions.length, 1, `${label}: active sessions count`);
  assert.equal(activeSessions[0]?.id, scenario.ownedSessionId);

  const ownedToken = await repository.findActiveSessionToken(
    scenario.userId,
    scenario.ownedSessionId,
    scenario.now,
  );
  assert.equal(ownedToken, scenario.ownedToken, `${label}: owned token`);

  const missingToken = await repository.findActiveSessionToken(
    scenario.userId,
    scenario.expiredSessionId,
    scenario.now,
  );
  assert.equal(missingToken, null, `${label}: expired token lookup`);

  const foreignToken = await repository.findActiveSessionToken(
    scenario.userId,
    scenario.foreignSessionId,
    scenario.now,
  );
  assert.equal(foreignToken, null, `${label}: foreign ownership lookup`);

  const foreignOwnedToken = await repository.findActiveSessionToken(
    scenario.foreignUserId,
    scenario.foreignSessionId,
    scenario.now,
  );
  assert.equal(
    foreignOwnedToken,
    scenario.foreignToken,
    `${label}: foreign user token`,
  );
}

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

test('owned sessions repository parity on postgres-js drizzle adapter', async () => {
  const client = new PGlite();
  await client.exec(AUTH_FOUNDATION_MIGRATION_SQL);
  const port = 55000 + Math.floor(Math.random() * 1000);
  const server = new PGLiteSocketServer({
    db: client,
    host: '127.0.0.1',
    port,
  });
  await server.start();

  const sql = postgres(`postgres://postgres@127.0.0.1:${port}/postgres`, {
    max: 1,
  });
  const database = drizzlePostgres(sql, {
    schema: { session, user },
  });

  try {
    await runOwnedSessionsRepositoryParityScenarios(
      async () => ({
        database,
        repository: createOwnedSessionsRepository(database),
      }),
      'postgres-js',
    );
  } finally {
    await sql.end({ timeout: 1 });
    await server.stop();
    await client.close();
  }
});
