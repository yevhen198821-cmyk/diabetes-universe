import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TIMELINE_INDEXEDDB_DATABASE_NAME,
  TIMELINE_INDEXEDDB_EVENT_INDEXES,
  TIMELINE_INDEXEDDB_STORES,
  TIMELINE_INDEXEDDB_VERSION,
  TIMELINE_STORAGE_SCHEMA_VERSION,
  isTimelineBootstrapMetadata,
  timelineIndexedDbSchemaV1,
  validateIndexedDbTimelineEventRecord,
} from '../../index.ts';

const glucoseEvent = {
  concentrationMmolPerL: 6.4,
  createdAt: '2026-08-09T08:00:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  occurredAt: '2026-08-09T08:00:00.000Z',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:00:00.000Z',
};

function createRecord(overrides = {}) {
  return {
    event: glucoseEvent,
    id: glucoseEvent.id,
    kind: glucoseEvent.kind,
    occurredAt: glucoseEvent.occurredAt,
    persistedAt: '2026-08-09T09:00:00.000Z',
    storageSchemaVersion: 1,
    ...overrides,
  };
}

test('declares the approved P4 IndexedDB database identity', () => {
  assert.equal(TIMELINE_INDEXEDDB_DATABASE_NAME, 'diabetes-universe-timeline');
  assert.equal(TIMELINE_INDEXEDDB_VERSION, 2);
  assert.equal(TIMELINE_STORAGE_SCHEMA_VERSION, 1);
  assert.equal(
    timelineIndexedDbSchemaV1.databaseName,
    TIMELINE_INDEXEDDB_DATABASE_NAME,
  );
});

test('declares v2 stores including adoption persistence', () => {
  assert.deepEqual(TIMELINE_INDEXEDDB_STORES, {
    events: 'timeline_events',
    metadata: 'timeline_metadata',
    quarantine: 'timeline_quarantine',
    adoptionAcknowledgements: 'timeline_adoption_acknowledgements',
    adoptionSessions: 'timeline_adoption_sessions',
    adoptionQuarantine: 'timeline_adoption_quarantine',
  });
  assert.deepEqual(TIMELINE_INDEXEDDB_EVENT_INDEXES, {
    byKindOccurredAtId: 'by_kind_occurredAt_id',
    byOccurredAtId: 'by_occurredAt_id',
  });
  assert.deepEqual(timelineIndexedDbSchemaV1.eventStore.indexes, [
    {
      keyPath: ['occurredAt', 'id'],
      name: 'by_occurredAt_id',
      unique: false,
    },
    {
      keyPath: ['kind', 'occurredAt', 'id'],
      name: 'by_kind_occurredAt_id',
      unique: false,
    },
  ]);
});

test('accepts a structurally valid event record', () => {
  const result = validateIndexedDbTimelineEventRecord(createRecord());

  assert.equal(result.status, 'ok');
  if (result.status === 'ok') {
    assert.equal(result.record.event.id, glucoseEvent.id);
  }
});

test('quarantines unsupported storage schema versions', () => {
  const result = validateIndexedDbTimelineEventRecord(
    createRecord({ storageSchemaVersion: 2 }),
  );

  assert.deepEqual(result, {
    reason: 'unsupported_storage_schema',
    sourceRecordId: glucoseEvent.id,
    status: 'quarantine',
    storageSchemaVersion: 2,
  });
});

test('quarantines duplicated semantic identity mismatches', () => {
  const result = validateIndexedDbTimelineEventRecord(
    createRecord({ occurredAt: '2026-08-09T08:01:00.000Z' }),
  );

  assert.deepEqual(result, {
    reason: 'semantic_identity_mismatch',
    sourceRecordId: glucoseEvent.id,
    status: 'quarantine',
    storageSchemaVersion: 1,
  });
});

test('rejects invalid semantic numeric payloads', () => {
  const result = validateIndexedDbTimelineEventRecord(
    createRecord({
      event: {
        ...glucoseEvent,
        concentrationMmolPerL: Number.NaN,
      },
    }),
  );

  assert.equal(result.status, 'quarantine');
  if (result.status === 'quarantine') {
    assert.equal(result.reason, 'invalid_event_schema');
  }
});

test('validates bootstrap metadata independently from event schema versions', () => {
  assert.equal(
    isTimelineBootstrapMetadata({
      bootstrapVersion: 1,
      completedAt: '2026-08-09T09:00:00.000Z',
      key: 'bootstrap',
      seedVersion: 1,
    }),
    true,
  );
  assert.equal(
    isTimelineBootstrapMetadata({
      bootstrapVersion: 2,
      completedAt: '2026-08-09T09:00:00.000Z',
      key: 'bootstrap',
      seedVersion: 1,
    }),
    false,
  );
});
