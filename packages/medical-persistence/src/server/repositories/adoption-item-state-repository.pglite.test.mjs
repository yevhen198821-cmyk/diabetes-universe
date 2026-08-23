import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import {
  MEDICAL_ADOPTION_ITEM_STATES_MIGRATION_SQL,
  MEDICAL_ADOPTION_MIGRATION_SQL,
  MEDICAL_ADOPTION_SUBJECT_RESOURCE_FK_MIGRATION_SQL,
  MEDICAL_FOUNDATION_MIGRATION_SQL,
} from '../database/medical-foundation-migration.ts';
import { medicalSchema } from '../database/medical-schema.ts';
import { createAdoptionItemStateRepository } from './adoption-item-state-repository.ts';
import { createAdoptionSessionRepository } from './adoption-session-repository.ts';
import { createMedicalSubjectRepository } from './medical-subject-repository.ts';

async function bootstrapDatabase() {
  const client = new PGlite();
  await client.exec(MEDICAL_FOUNDATION_MIGRATION_SQL);
  await client.exec(MEDICAL_ADOPTION_MIGRATION_SQL);
  await client.exec(MEDICAL_ADOPTION_SUBJECT_RESOURCE_FK_MIGRATION_SQL);
  await client.exec(MEDICAL_ADOPTION_ITEM_STATES_MIGRATION_SQL);
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectRepository = createMedicalSubjectRepository(database);
  const relationship =
    await subjectRepository.provisionSelfSubject('acct-item-state');
  const sessionRepository = createAdoptionSessionRepository(database);
  const session = await sessionRepository.create({
    actorAccountId: 'acct-item-state',
    subjectId: relationship.subjectId,
    clientAdoptionRunId: 'run-item-state',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });
  return {
    database,
    subjectId: relationship.subjectId,
    adoptionSessionId: session.adoptionSessionId,
  };
}

test('recordOutcome tracks current unresolved failures per source identity', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const repository = createAdoptionItemStateRepository(database);

  const first = await repository.recordOutcome({
    subjectId,
    adoptionSessionId,
    sourceNamespace: 'ns_state',
    localEventId: 'local-state-1',
    payloadFingerprint: 'fp-1',
    outcome: 'failed',
    failureCode: 'ADOPTION_SOURCE_CONFLICT',
  });
  assert.deepEqual(first, { adoptedCount: 0, skippedCount: 0, failedCount: 1 });
  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    1,
  );

  const repeat = await repository.recordOutcome({
    subjectId,
    adoptionSessionId,
    sourceNamespace: 'ns_state',
    localEventId: 'local-state-1',
    payloadFingerprint: 'fp-1',
    outcome: 'failed',
    failureCode: 'ADOPTION_SOURCE_CONFLICT',
  });
  assert.deepEqual(repeat, {
    adoptedCount: 0,
    skippedCount: 0,
    failedCount: 0,
  });
  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    1,
  );

  const resolved = await repository.recordOutcome({
    subjectId,
    adoptionSessionId,
    sourceNamespace: 'ns_state',
    localEventId: 'local-state-1',
    payloadFingerprint: 'fp-1',
    outcome: 'adopted',
    canonicalResourceId: '00000000-0000-4000-8000-000000000010',
  });
  assert.deepEqual(resolved, {
    adoptedCount: 1,
    skippedCount: 0,
    failedCount: -1,
  });
  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    0,
  );
});

test('item state rows are scoped by subject and session', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const subjectRepository = createMedicalSubjectRepository(database);
  const otherSubject =
    await subjectRepository.provisionSelfSubject('acct-other');
  const sessionRepository = createAdoptionSessionRepository(database);
  const otherSession = await sessionRepository.create({
    actorAccountId: 'acct-other',
    subjectId: otherSubject.subjectId,
    clientAdoptionRunId: 'run-other',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });
  const repository = createAdoptionItemStateRepository(database);

  await repository.recordOutcome({
    subjectId,
    adoptionSessionId,
    sourceNamespace: 'ns_state',
    localEventId: 'local-state-1',
    payloadFingerprint: 'fp-1',
    outcome: 'failed',
    failureCode: 'ADOPTION_SOURCE_CONFLICT',
  });

  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    1,
  );
  assert.equal(
    await repository.countUnresolved(
      otherSubject.subjectId,
      otherSession.adoptionSessionId,
    ),
    0,
  );
});
