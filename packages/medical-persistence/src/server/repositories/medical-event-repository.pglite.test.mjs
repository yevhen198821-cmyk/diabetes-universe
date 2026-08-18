import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import { MEDICAL_FOUNDATION_MIGRATION_SQL } from '../database/medical-foundation-migration.ts';
import { medicalSchema } from '../database/medical-schema.ts';
import { createMedicalEventRepository } from './medical-event-repository.ts';
import { createMedicalSubjectRepository } from './medical-subject-repository.ts';

function glucoseEvent(occurredAt, concentration = 5.6) {
  return {
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: concentration,
    context: 'fasting',
  };
}

async function seedSubject(database) {
  const subjectRepository = createMedicalSubjectRepository(database);
  const relationship =
    await subjectRepository.provisionSelfSubject('acct-list');
  return relationship.subjectId;
}

test('listKeyset paginates without OFFSET and preserves traversal boundary', async () => {
  const client = new PGlite();
  await client.exec(MEDICAL_FOUNDATION_MIGRATION_SQL);
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectId = await seedSubject(database);
  const repository = createMedicalEventRepository(database);

  const inserted = [
    await repository.insert(subjectId, {
      semanticEvent: glucoseEvent('2026-08-14T11:00:00.000Z'),
      createdByAccountId: 'acct-list',
    }),
    await repository.insert(subjectId, {
      semanticEvent: glucoseEvent('2026-08-14T11:00:00.000Z'),
      createdByAccountId: 'acct-list',
    }),
    await repository.insert(subjectId, {
      semanticEvent: glucoseEvent('2026-08-14T10:00:00.000Z'),
      createdByAccountId: 'acct-list',
    }),
  ];

  const traversalStartedAt = new Date();

  const pageOne = await repository.listKeyset({
    subjectId,
    limit: 2,
    traversalStartedAt,
  });
  assert.equal(pageOne.length, 2);

  const pageTwo = await repository.listKeyset({
    subjectId,
    limit: 2,
    traversalStartedAt,
    cursor: {
      eventObservedAt: new Date(pageOne[1].eventObservedAt),
      resourceId: pageOne[1].resourceId,
    },
  });

  assert.equal(pageTwo.length, 1);
  const ids = [...pageOne, ...pageTwo].map((row) => row.resourceId);
  assert.equal(new Set(ids).size, 3);

  await new Promise((resolve) => setTimeout(resolve, 5));

  await repository.updateWithRevision(
    subjectId,
    inserted[2].resourceId,
    inserted[2].revision,
    {
      semanticEvent: glucoseEvent('2026-08-14T09:30:00.000Z', 6.1),
      updatedByAccountId: 'acct-list',
    },
  );

  const afterEdit = await repository.listKeyset({
    subjectId,
    limit: 10,
    traversalStartedAt,
  });
  assert.equal(
    afterEdit.some((row) => row.resourceId === inserted[2].resourceId),
    false,
  );

  await client.close();
});

test('updateWithRevision rejects stale revision via CAS', async () => {
  const client = new PGlite();
  await client.exec(MEDICAL_FOUNDATION_MIGRATION_SQL);
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectId = await seedSubject(database);
  const repository = createMedicalEventRepository(database);

  const created = await repository.insert(subjectId, {
    semanticEvent: glucoseEvent('2026-08-14T10:00:00.000Z'),
    createdByAccountId: 'acct-cas',
  });

  const updated = await repository.updateWithRevision(
    subjectId,
    created.resourceId,
    created.revision,
    {
      semanticEvent: glucoseEvent('2026-08-14T10:05:00.000Z', 6.2),
      updatedByAccountId: 'acct-cas',
    },
  );

  assert.equal(updated?.revision, 2n);

  const stale = await repository.updateWithRevision(
    subjectId,
    created.resourceId,
    created.revision,
    {
      semanticEvent: glucoseEvent('2026-08-14T10:06:00.000Z', 6.3),
      updatedByAccountId: 'acct-cas',
    },
  );

  assert.equal(stale, null);

  await client.close();
});
