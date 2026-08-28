import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import { readMedicalFoundationMigrationSql } from './medical-pglite-bootstrap-migrations.ts';
import { medicalSchema } from './medical-schema.ts';
import { createMedicalEventRepository } from '../repositories/medical-event-repository.ts';
import { createMedicalSubjectRepository } from '../repositories/medical-subject-repository.ts';

test('mutation transaction rolls back all writes on failure', async () => {
  const client = new PGlite();
  await client.exec(readMedicalFoundationMigrationSql());
  const database = drizzlePglite(client, { schema: medicalSchema });
  const subjectId = (
    await createMedicalSubjectRepository(database).provisionSelfSubject(
      'acct-tx',
    )
  ).subjectId;

  await assert.rejects(
    () =>
      database.transaction(async (tx) => {
        const txEvents = createMedicalEventRepository(tx);
        await txEvents.insert(subjectId, {
          semanticEvent: {
            occurredAt: '2026-08-14T10:00:00.000Z',
            schemaVersion: 1,
            source: 'manual',
            kind: 'glucose',
            concentrationMmolPerL: 5.5,
            context: 'fasting',
          },
          createdByAccountId: 'acct-tx',
        });
        throw new Error('forced-failure');
      }),
    /forced-failure/,
  );

  const count = await client.query(
    'SELECT COUNT(*)::int AS count FROM medical.medical_event_resources',
  );
  assert.equal(count.rows[0].count, 0);

  await client.close();
});
