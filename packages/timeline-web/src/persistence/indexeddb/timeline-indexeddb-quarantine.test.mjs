import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  TIMELINE_INDEXEDDB_STORES,
  createIndexedDbTimelineRepository,
} from '../../index.ts';

const FIXED_NOW = '2026-08-09T20:05:00.000Z';

function createTestDatabaseName(testName) {
  return `diabetes-universe-timeline-quarantine-${testName}`;
}

async function deleteTestDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

async function openNativeDatabase(databaseName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function corruptRecord(id, occurredAt) {
  return {
    id,
    occurredAt,
    kind: 'glucose',
    event: {
      concentrationMmolPerL: 6.4,
      createdAt: occurredAt,
      id,
      kind: 'glucose',
      occurredAt,
      schemaVersion: 999,
      source: 'demo',
      updatedAt: occurredAt,
    },
    persistedAt: FIXED_NOW,
    storageSchemaVersion: 1,
  };
}

async function putRawEvent(databaseName, record) {
  const database = await openNativeDatabase(databaseName);
  const transaction = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readwrite',
  );
  transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events).put(record);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(undefined);
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

async function readStorageEvidence(databaseName, eventId) {
  const database = await openNativeDatabase(databaseName);
  const transaction = database.transaction(
    [TIMELINE_INDEXEDDB_STORES.events, TIMELINE_INDEXEDDB_STORES.quarantine],
    'readonly',
  );
  const eventRequest = transaction
    .objectStore(TIMELINE_INDEXEDDB_STORES.events)
    .get(eventId);
  const quarantineRequest = transaction
    .objectStore(TIMELINE_INDEXEDDB_STORES.quarantine)
    .getAll();
  const [event, quarantine] = await Promise.all([
    new Promise((resolve, reject) => {
      eventRequest.onsuccess = () => resolve(eventRequest.result);
      eventRequest.onerror = () => reject(eventRequest.error);
    }),
    new Promise((resolve, reject) => {
      quarantineRequest.onsuccess = () => resolve(quarantineRequest.result);
      quarantineRequest.onerror = () => reject(quarantineRequest.error);
    }),
  ]);
  database.close();
  return { event, quarantine };
}

async function createReadyRepository(testName) {
  const databaseName = createTestDatabaseName(testName);
  await deleteTestDatabase(databaseName);
  const repository = createIndexedDbTimelineRepository({ databaseName });
  await repository.initialize();
  return { databaseName, repository };
}

test('getById durably quarantines a corrupt medical row before failing closed', async () => {
  const { databaseName, repository } = await createReadyRepository('get-by-id');
  const raw = corruptRecord('corrupt-get', '2026-08-09T08:00:00.000Z');
  await putRawEvent(databaseName, raw);

  await assert.rejects(
    () => repository.getById('corrupt-get'),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_READ_FAILED');
      return true;
    },
  );

  const evidence = await readStorageEvidence(databaseName, 'corrupt-get');
  assert.equal(evidence.event, undefined);
  assert.equal(evidence.quarantine.length, 1);
  assert.equal(evidence.quarantine[0].sourceRecordId, 'corrupt-get');
  assert.equal(evidence.quarantine[0].reason, 'invalid_event_schema');
  assert.deepEqual(evidence.quarantine[0].raw, raw);

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('queryEvents durably quarantines a corrupt indexed row before failing closed', async () => {
  const { databaseName, repository } = await createReadyRepository('query');
  const raw = corruptRecord('corrupt-query', '2026-08-09T08:00:00.000Z');
  await putRawEvent(databaseName, raw);

  await assert.rejects(
    () =>
      repository.queryEvents({
        limit: 10,
        order: 'occurredAt-asc',
      }),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_READ_FAILED');
      return true;
    },
  );

  const evidence = await readStorageEvidence(databaseName, 'corrupt-query');
  assert.equal(evidence.event, undefined);
  assert.equal(evidence.quarantine.length, 1);
  assert.equal(evidence.quarantine[0].sourceRecordId, 'corrupt-query');
  assert.equal(evidence.quarantine[0].reason, 'invalid_event_schema');
  assert.deepEqual(evidence.quarantine[0].raw, raw);

  repository.close();
  await deleteTestDatabase(databaseName);
});
