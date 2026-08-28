import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalFoundationMigrationSql,
} from '../database/medical-pglite-bootstrap-migrations.ts';
import { medicalSchema } from '../database/medical-schema.ts';
import { createAdoptionSessionRepository } from './adoption-session-repository.ts';
import { createMedicalSubjectRepository } from './medical-subject-repository.ts';

async function bootstrapDatabase() {
  const client = new PGlite();
  await client.exec(readMedicalFoundationMigrationSql());
  await client.exec(readMedicalAdoptionMigrationSql());
  await client.exec(readMedicalAdoptionSubjectResourceFkMigrationSql());
  await client.exec(readMedicalAdoptionItemStatesMigrationSql());
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectRepository = createMedicalSubjectRepository(database);
  const relationship =
    await subjectRepository.provisionSelfSubject('acct-counter');
  return { database, subjectId: relationship.subjectId };
}

test('incrementCounters applies atomic SQL deltas under concurrency', async () => {
  const { database, subjectId } = await bootstrapDatabase();
  const sessionRepository = createAdoptionSessionRepository(database);

  const session = await sessionRepository.create({
    actorAccountId: 'acct-counter',
    subjectId,
    clientAdoptionRunId: 'run-counter',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const [first, second] = await Promise.all([
    sessionRepository.incrementCounters(subjectId, session.adoptionSessionId, {
      adoptedCount: 2,
      skippedCount: 1,
    }),
    sessionRepository.incrementCounters(subjectId, session.adoptionSessionId, {
      adoptedCount: 3,
      failedCount: 1,
    }),
  ]);

  assert.ok(first);
  assert.ok(second);

  const final = await sessionRepository.findByIdForSubject(
    subjectId,
    session.adoptionSessionId,
  );
  assert.equal(final?.adoptedCount, 5);
  assert.equal(final?.skippedCount, 1);
  assert.equal(final?.failedCount, 1);
});

test('transitionLifecycle is CAS-protected by subject and prior state', async () => {
  const { database, subjectId } = await bootstrapDatabase();
  const sessionRepository = createAdoptionSessionRepository(database);

  const session = await sessionRepository.create({
    actorAccountId: 'acct-cas',
    subjectId,
    clientAdoptionRunId: 'run-cas',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const cancelled = await sessionRepository.transitionLifecycle(
    subjectId,
    session.adoptionSessionId,
    ['open'],
    'cancelled',
    { completedAt: new Date() },
  );
  assert.equal(cancelled?.lifecycleState, 'cancelled');

  const reopen = await sessionRepository.transitionLifecycle(
    subjectId,
    session.adoptionSessionId,
    ['open', 'failed'],
    'open',
  );
  assert.equal(reopen, null);

  const crossSubject = await sessionRepository.transitionLifecycle(
    '00000000-0000-4000-8000-000000000099',
    session.adoptionSessionId,
    ['cancelled'],
    'open',
  );
  assert.equal(crossSubject, null);
});
