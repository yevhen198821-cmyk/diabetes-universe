import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import {
  readMedicalAdoptionItemStatesMigrationSql,
  readMedicalAdoptionMigrationSql,
  readMedicalAdoptionSubjectResourceFkMigrationSql,
  readMedicalFoundationMigrationSql,
} from '../database/medical-pglite-bootstrap-migrations.ts';
import {
  medicalAdoptionItemStates,
  medicalSchema,
} from '../database/medical-schema.ts';
import { createAdoptionItemStateRepository } from './adoption-item-state-repository.ts';
import { createAdoptionSessionRepository } from './adoption-session-repository.ts';
import { createMedicalSubjectRepository } from './medical-subject-repository.ts';

const ZERO_DELTA = { adoptedCount: 0, skippedCount: 0, failedCount: 0 };

async function bootstrapDatabase() {
  const client = new PGlite();
  await client.exec(readMedicalFoundationMigrationSql());
  await client.exec(readMedicalAdoptionMigrationSql());
  await client.exec(readMedicalAdoptionSubjectResourceFkMigrationSql());
  await client.exec(readMedicalAdoptionItemStatesMigrationSql());
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

function baseOutcomeInput(subjectId, adoptionSessionId, localEventId) {
  return {
    subjectId,
    adoptionSessionId,
    sourceNamespace: 'ns_concurrent',
    localEventId,
    payloadFingerprint: 'fp-concurrent',
  };
}

async function countItemStateRows(
  database,
  subjectId,
  adoptionSessionId,
  localEventId,
) {
  const rows = await database
    .select({ count: sql`count(*)::int` })
    .from(medicalAdoptionItemStates)
    .where(
      and(
        eq(medicalAdoptionItemStates.subjectId, subjectId),
        eq(medicalAdoptionItemStates.adoptionSessionId, adoptionSessionId),
        eq(medicalAdoptionItemStates.sourceNamespace, 'ns_concurrent'),
        eq(medicalAdoptionItemStates.localEventId, localEventId),
      ),
    );
  return rows[0]?.count ?? 0;
}

test('concurrent first failures serialize to one row and one failed delta', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const repository = createAdoptionItemStateRepository(database);
  const input = baseOutcomeInput(
    subjectId,
    adoptionSessionId,
    'local-concurrent-fail',
  );

  const [first, second] = await Promise.all([
    repository.recordOutcome({
      ...input,
      outcome: 'failed',
      failureCode: 'ADOPTION_SOURCE_CONFLICT',
    }),
    repository.recordOutcome({
      ...input,
      outcome: 'failed',
      failureCode: 'ADOPTION_SOURCE_CONFLICT',
    }),
  ]);

  assert.equal(first.failedCount + second.failedCount, 1);
  assert.equal(
    await countItemStateRows(
      database,
      subjectId,
      adoptionSessionId,
      'local-concurrent-fail',
    ),
    1,
  );
  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    1,
  );
});

test('concurrent first adopted outcomes serialize to one row and one adopted delta', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const repository = createAdoptionItemStateRepository(database);
  const input = baseOutcomeInput(
    subjectId,
    adoptionSessionId,
    'local-concurrent-adopted',
  );
  const resourceId = '00000000-0000-4000-8000-000000000020';

  const [first, second] = await Promise.all([
    repository.recordOutcome({
      ...input,
      outcome: 'adopted',
      canonicalResourceId: resourceId,
    }),
    repository.recordOutcome({
      ...input,
      outcome: 'adopted',
      canonicalResourceId: resourceId,
    }),
  ]);

  assert.equal(first.adoptedCount + second.adoptedCount, 1);
  assert.equal(first.failedCount + second.failedCount, 0);
  assert.equal(
    await countItemStateRows(
      database,
      subjectId,
      adoptionSessionId,
      'local-concurrent-adopted',
    ),
    1,
  );
});

test('concurrent failed vs adopted converges with consistent counters', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const repository = createAdoptionItemStateRepository(database);
  const input = baseOutcomeInput(
    subjectId,
    adoptionSessionId,
    'local-concurrent-race',
  );
  const resourceId = '00000000-0000-4000-8000-000000000030';

  const [failedDelta, adoptedDelta] = await Promise.all([
    repository.recordOutcome({
      ...input,
      outcome: 'failed',
      failureCode: 'ADOPTION_SOURCE_CONFLICT',
    }),
    repository.recordOutcome({
      ...input,
      outcome: 'adopted',
      canonicalResourceId: resourceId,
    }),
  ]);

  const totalFailed = failedDelta.failedCount + adoptedDelta.failedCount;
  const totalAdopted = failedDelta.adoptedCount + adoptedDelta.adoptedCount;
  assert.ok(totalFailed >= 0);
  assert.ok(totalAdopted >= 0);
  assert.equal(totalFailed + totalAdopted, 1);
  assert.equal(
    await countItemStateRows(
      database,
      subjectId,
      adoptionSessionId,
      'local-concurrent-race',
    ),
    1,
  );
});

test('concurrent replay after resolved state produces zero extra delta', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const repository = createAdoptionItemStateRepository(database);
  const input = baseOutcomeInput(
    subjectId,
    adoptionSessionId,
    'local-concurrent-replay',
  );
  const resourceId = '00000000-0000-4000-8000-000000000040';

  await repository.recordOutcome({
    ...input,
    outcome: 'adopted',
    canonicalResourceId: resourceId,
  });

  const [first, second] = await Promise.all([
    repository.recordOutcome({
      ...input,
      outcome: 'adopted',
      canonicalResourceId: resourceId,
    }),
    repository.recordOutcome({
      ...input,
      outcome: 'adopted',
      canonicalResourceId: resourceId,
    }),
  ]);

  assert.deepEqual(first, ZERO_DELTA);
  assert.deepEqual(second, ZERO_DELTA);
});

test('concurrent first writes remain isolated across subjects', async () => {
  const { database, subjectId, adoptionSessionId } = await bootstrapDatabase();
  const subjectRepository = createMedicalSubjectRepository(database);
  const otherSubject = await subjectRepository.provisionSelfSubject(
    'acct-concurrent-other',
  );
  const sessionRepository = createAdoptionSessionRepository(database);
  const otherSession = await sessionRepository.create({
    actorAccountId: 'acct-concurrent-other',
    subjectId: otherSubject.subjectId,
    clientAdoptionRunId: 'run-concurrent-other',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });
  const repository = createAdoptionItemStateRepository(database);
  const sharedLocalEventId = 'local-shared-identity';

  const [subjectDelta, otherDelta] = await Promise.all([
    repository.recordOutcome({
      ...baseOutcomeInput(subjectId, adoptionSessionId, sharedLocalEventId),
      outcome: 'failed',
      failureCode: 'ADOPTION_SOURCE_CONFLICT',
    }),
    repository.recordOutcome({
      ...baseOutcomeInput(
        otherSubject.subjectId,
        otherSession.adoptionSessionId,
        sharedLocalEventId,
      ),
      outcome: 'failed',
      failureCode: 'ADOPTION_SOURCE_CONFLICT',
    }),
  ]);

  assert.equal(subjectDelta.failedCount + otherDelta.failedCount, 2);
  assert.equal(
    await repository.countUnresolved(subjectId, adoptionSessionId),
    1,
  );
  assert.equal(
    await repository.countUnresolved(
      otherSubject.subjectId,
      otherSession.adoptionSessionId,
    ),
    1,
  );
});
