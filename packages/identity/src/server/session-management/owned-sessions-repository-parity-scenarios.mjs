import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { session, user } from '../database/auth-schema.ts';

export async function seedOwnedSessionScenario(database) {
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
