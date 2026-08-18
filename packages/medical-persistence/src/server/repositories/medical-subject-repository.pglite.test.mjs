import assert from 'node:assert/strict';
import test from 'node:test';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import { MEDICAL_FOUNDATION_MIGRATION_SQL } from '../database/medical-foundation-migration.ts';
import { medicalSchema } from '../database/medical-schema.ts';
import { purgeExpiredIdempotencyRecords } from '../maintenance/purge-expired-idempotency.ts';
import { createMedicalSubjectRepository } from '../repositories/medical-subject-repository.ts';

async function createTestDatabase() {
  const client = new PGlite();
  await client.exec(MEDICAL_FOUNDATION_MIGRATION_SQL);
  const database = drizzlePglite(client, { schema: medicalSchema });
  return { client, database };
}

test('provisionSelfSubject is concurrency-safe and idempotent', async () => {
  const { client, database } = await createTestDatabase();
  const repository = createMedicalSubjectRepository(database);
  const accountId = 'account-concurrency-1';

  const [first, second, third] = await Promise.all([
    repository.provisionSelfSubject(accountId),
    repository.provisionSelfSubject(accountId),
    repository.provisionSelfSubject(accountId),
  ]);

  assert.equal(first.subjectId, second.subjectId);
  assert.equal(second.subjectId, third.subjectId);
  assert.equal(first.relationshipId, second.relationshipId);

  await client.close();
});

test('purge_expired_idempotency_records deletes only expired rows', async () => {
  const { client, database } = await createTestDatabase();

  await client.exec(`
    INSERT INTO medical.medical_idempotency_records (
      idempotency_record_id, account_id, subject_id, api_version, operation_scope,
      idempotency_key, request_fingerprint, result_resource_id, result_revision,
      result_etag_token, stored_http_status, created_at, expires_at
    ) VALUES
      ('11111111-1111-4111-8111-111111111111', 'acct', '22222222-2222-4222-8222-222222222222', 'v1', 'medical_event.create', 'k1', 'fp1', '33333333-3333-4333-8333-333333333333', 1, 'etag1', 201, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
      ('44444444-4444-4444-8444-444444444444', 'acct', '22222222-2222-4222-8222-222222222222', 'v1', 'medical_event.create', 'k2', 'fp2', '55555555-5555-4555-8555-555555555555', 1, 'etag2', 201, NOW(), NOW() + INTERVAL '1 day');
  `);

  const deleted = await purgeExpiredIdempotencyRecords(database, 100);
  assert.equal(deleted, 1);

  const remaining = await client.query(
    'SELECT idempotency_key FROM medical.medical_idempotency_records ORDER BY idempotency_key',
  );
  assert.deepEqual(
    remaining.rows.map((row) => row.idempotency_key),
    ['k2'],
  );

  await client.close();
});

test('purge_expired_idempotency_records enforces batch clamp', async () => {
  const { client, database } = await createTestDatabase();

  await client.exec(`
    INSERT INTO medical.medical_idempotency_records (
      idempotency_record_id, account_id, subject_id, api_version, operation_scope,
      idempotency_key, request_fingerprint, result_resource_id, result_revision,
      result_etag_token, stored_http_status, created_at, expires_at
    ) VALUES
      ('11111111-1111-4111-8111-111111111111', 'acct', '22222222-2222-4222-8222-222222222222', 'v1', 'medical_event.create', 'k1', 'fp1', '33333333-3333-4333-8333-333333333333', 1, 'etag1', 201, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
      ('44444444-4444-4444-8444-444444444444', 'acct', '22222222-2222-4222-8222-222222222222', 'v1', 'medical_event.create', 'k2', 'fp2', '55555555-5555-4555-8555-555555555555', 1, 'etag2', 201, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day');
  `);

  const deleted = await purgeExpiredIdempotencyRecords(database, 1);
  assert.equal(deleted, 1);

  await client.close();
});
