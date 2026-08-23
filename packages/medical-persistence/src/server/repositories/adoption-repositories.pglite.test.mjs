import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import {
  MEDICAL_ADOPTION_MIGRATION_SQL,
  MEDICAL_FOUNDATION_MIGRATION_SQL,
} from '../database/medical-foundation-migration.ts';
import { medicalSchema } from '../database/medical-schema.ts';
import { createAdoptionMappingRepository } from './adoption-mapping-repository.ts';
import { createAdoptionSessionRepository } from './adoption-session-repository.ts';
import { createMedicalEventRepository } from './medical-event-repository.ts';
import { createMedicalSubjectRepository } from './medical-subject-repository.ts';

const OTHER_SUBJECT_UUID = '00000000-0000-4000-8000-000000000099';

function glucoseEvent(localEventId) {
  return {
    occurredAt: '2026-08-14T10:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    context: 'fasting',
    id: localEventId,
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
  };
}

async function bootstrapDatabase() {
  const client = new PGlite();
  await client.exec(MEDICAL_FOUNDATION_MIGRATION_SQL);
  await client.exec(MEDICAL_ADOPTION_MIGRATION_SQL);
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectRepository = createMedicalSubjectRepository(database);
  const relationship =
    await subjectRepository.provisionSelfSubject('acct-adopt-repo');
  return { database, subjectId: relationship.subjectId };
}

test('adoption session lifecycle and cross-subject isolation', async () => {
  const { database, subjectId } = await bootstrapDatabase();
  const sessionRepository = createAdoptionSessionRepository(database);

  const session = await sessionRepository.create({
    actorAccountId: 'acct-adopt-repo',
    subjectId,
    clientAdoptionRunId: 'run-repo-1',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
    eligibleCount: 2,
  });

  assert.equal(session.lifecycleState, 'open');

  const crossSubject = await sessionRepository.findByIdForSubject(
    OTHER_SUBJECT_UUID,
    session.adoptionSessionId,
  );
  assert.equal(crossSubject, null);

  const failed = await sessionRepository.updateLifecycle(
    session.adoptionSessionId,
    'failed',
  );
  assert.equal(failed?.lifecycleState, 'failed');

  const resumed = await sessionRepository.updateLifecycle(
    session.adoptionSessionId,
    'open',
  );
  assert.equal(resumed?.lifecycleState, 'open');

  const completed = await sessionRepository.updateLifecycle(
    session.adoptionSessionId,
    'completed',
    { completedAt: new Date() },
  );
  assert.equal(completed?.lifecycleState, 'completed');
});

test('adoption mapping unique constraint and fingerprint conflict', async () => {
  const { database, subjectId } = await bootstrapDatabase();
  const sessionRepository = createAdoptionSessionRepository(database);
  const mappingRepository = createAdoptionMappingRepository(database);
  const eventRepository = createMedicalEventRepository(database);

  const session = await sessionRepository.create({
    actorAccountId: 'acct-adopt-repo',
    subjectId,
    clientAdoptionRunId: 'run-repo-map',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const resource = await eventRepository.insert(subjectId, {
    semanticEvent: glucoseEvent('local-map-1'),
    createdByAccountId: 'acct-adopt-repo',
  });

  const baseInput = {
    subjectId,
    sourceNamespace: 'ns_repo_map',
    localEventId: 'local-map-1',
    canonicalResourceId: resource.resourceId,
    canonicalRevision: BigInt(resource.revision),
    sourceSchemaVersion: 1,
    payloadFingerprint: 'fp_same',
    adoptionSessionId: session.adoptionSessionId,
  };

  const first = await mappingRepository.insertMapping(baseInput);
  const replay = await mappingRepository.insertMapping(baseInput);
  assert.equal(replay.adoptionMappingId, first.adoptionMappingId);

  await assert.rejects(
    () =>
      mappingRepository.insertMapping({
        ...baseInput,
        payloadFingerprint: 'fp_different',
      }),
    (error) => error?.code === 'ADOPTION_SOURCE_CONFLICT',
  );

  const otherSubjectLookup = await mappingRepository.findBySourceIdentity(
    OTHER_SUBJECT_UUID,
    baseInput.sourceNamespace,
    baseInput.localEventId,
  );
  assert.equal(otherSubjectLookup, null);
});
