import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  TIMELINE_BOOTSTRAP_STATE_METADATA_KEY,
  TIMELINE_BOOTSTRAP_VERSION,
  TIMELINE_INDEXEDDB_STORES,
  TIMELINE_INDEXEDDB_VERSION,
  TIMELINE_STORAGE_SCHEMA_VERSION,
  createIndexedDbTimelineRepositoryFoundation,
  isTimelineBootstrapMetadata,
  isTimelineBootstrapStateMetadata,
  openTimelineIndexedDB,
} from '../../index.ts';

const FIXED_NOW = '2026-08-09T19:00:00.000Z';

function createTestDatabaseName(testName) {
  return `diabetes-universe-timeline-test-${testName}`;
}

async function deleteTestDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

test('openTimelineIndexedDB bootstraps a fresh database to ready', async () => {
  const databaseName = createTestDatabaseName('fresh-bootstrap');
  await deleteTestDatabase(databaseName);

  const result = await openTimelineIndexedDB({
    databaseName,
    now: () => FIXED_NOW,
  });

  assert.equal(result.connection.phase, 'ready');
  assert.equal(result.bootstrapState.phase, 'ready');
  assert.ok(result.bootstrapState.metadata);
  assert.equal(result.bootstrapState.metadata?.completedAt, FIXED_NOW);

  const bootstrapRecord = await result.connection.database
    .transaction(TIMELINE_INDEXEDDB_STORES.metadata, 'readonly')
    .objectStore(TIMELINE_INDEXEDDB_STORES.metadata)
    .get('bootstrap');
  assert.ok(isTimelineBootstrapMetadata(bootstrapRecord));

  const bootstrapStateRecord = await result.connection.database
    .transaction(TIMELINE_INDEXEDDB_STORES.metadata, 'readonly')
    .objectStore(TIMELINE_INDEXEDDB_STORES.metadata)
    .get(TIMELINE_BOOTSTRAP_STATE_METADATA_KEY);
  assert.ok(isTimelineBootstrapStateMetadata(bootstrapStateRecord));
  assert.equal(bootstrapStateRecord.status, 'ready');
  assert.equal(
    bootstrapStateRecord.storageSchemaVersion,
    TIMELINE_STORAGE_SCHEMA_VERSION,
  );

  result.connection.close();
  await deleteTestDatabase(databaseName);
});

test('reopening an existing bootstrapped database is idempotent', async () => {
  const databaseName = createTestDatabaseName('reopen-idempotent');
  await deleteTestDatabase(databaseName);

  const first = await openTimelineIndexedDB({
    databaseName,
    now: () => FIXED_NOW,
  });
  first.connection.close();

  const second = await openTimelineIndexedDB({
    databaseName,
    now: () => '2026-08-09T20:00:00.000Z',
  });

  assert.equal(second.connection.phase, 'ready');
  assert.equal(second.bootstrapState.metadata?.completedAt, FIXED_NOW);

  const metadataCount = await second.connection.database
    .transaction(TIMELINE_INDEXEDDB_STORES.metadata, 'readonly')
    .objectStore(TIMELINE_INDEXEDDB_STORES.metadata)
    .count();
  assert.equal(metadataCount, 2);

  second.connection.close();
  await deleteTestDatabase(databaseName);
});

test('fails bootstrap when event evidence exists without bootstrap metadata', async () => {
  const databaseName = createTestDatabaseName('bootstrap-inconsistent');
  await deleteTestDatabase(databaseName);

  const request = indexedDB.open(databaseName, TIMELINE_INDEXEDDB_VERSION);
  await new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      const database = request.result;
      const eventStore = database.createObjectStore(
        TIMELINE_INDEXEDDB_STORES.events,
        { keyPath: 'id' },
      );
      eventStore.createIndex('by_occurredAt_id', ['occurredAt', 'id'], {
        unique: false,
      });
      eventStore.createIndex(
        'by_kind_occurredAt_id',
        ['kind', 'occurredAt', 'id'],
        { unique: false },
      );
      database.createObjectStore(TIMELINE_INDEXEDDB_STORES.metadata, {
        keyPath: 'key',
      });
      database.createObjectStore(TIMELINE_INDEXEDDB_STORES.quarantine, {
        keyPath: 'quarantineId',
      });
    };
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });

  const database = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(
      databaseName,
      TIMELINE_INDEXEDDB_VERSION,
    );
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });

  const writeTx = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readwrite',
  );
  writeTx.objectStore(TIMELINE_INDEXEDDB_STORES.events).put({
    event: {
      concentrationMmolPerL: 6.4,
      createdAt: FIXED_NOW,
      id: 'glucose-1',
      kind: 'glucose',
      occurredAt: FIXED_NOW,
      schemaVersion: 1,
      source: 'demo',
      updatedAt: FIXED_NOW,
    },
    id: 'glucose-1',
    kind: 'glucose',
    occurredAt: FIXED_NOW,
    persistedAt: FIXED_NOW,
    storageSchemaVersion: 1,
  });
  await new Promise((resolve, reject) => {
    writeTx.oncomplete = () => resolve(undefined);
    writeTx.onerror = () => reject(writeTx.error);
  });
  database.close();

  await assert.rejects(
    () =>
      openTimelineIndexedDB({
        databaseName,
        now: () => FIXED_NOW,
      }),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT');
      return true;
    },
  );

  await deleteTestDatabase(databaseName);
});

test('rejects unsupported bootstrap metadata versions', async () => {
  const databaseName = createTestDatabaseName('bootstrap-version');
  await deleteTestDatabase(databaseName);

  const request = indexedDB.open(databaseName, TIMELINE_INDEXEDDB_VERSION);
  await new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      const database = request.result;
      database.createObjectStore(TIMELINE_INDEXEDDB_STORES.events, {
        keyPath: 'id',
      });
      database.createObjectStore(TIMELINE_INDEXEDDB_STORES.metadata, {
        keyPath: 'key',
      });
      database.createObjectStore(TIMELINE_INDEXEDDB_STORES.quarantine, {
        keyPath: 'quarantineId',
      });
    };
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });

  const database = await new Promise((resolve, reject) => {
    const openRequest = indexedDB.open(
      databaseName,
      TIMELINE_INDEXEDDB_VERSION,
    );
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });

  const writeTx = database.transaction(
    TIMELINE_INDEXEDDB_STORES.metadata,
    'readwrite',
  );
  writeTx.objectStore(TIMELINE_INDEXEDDB_STORES.metadata).put({
    key: 'bootstrap',
    bootstrapVersion: 99,
    seedVersion: 1,
    completedAt: FIXED_NOW,
  });
  await new Promise((resolve, reject) => {
    writeTx.oncomplete = () => resolve(undefined);
    writeTx.onerror = () => reject(writeTx.error);
  });
  database.close();

  await assert.rejects(
    () =>
      openTimelineIndexedDB({
        databaseName,
        now: () => FIXED_NOW,
      }),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT');
      return true;
    },
  );

  await deleteTestDatabase(databaseName);
});

test('createIndexedDbTimelineRepositoryFoundation initializes once and reuses connection', async () => {
  const databaseName = createTestDatabaseName('repository-foundation');
  await deleteTestDatabase(databaseName);

  const foundation = createIndexedDbTimelineRepositoryFoundation({
    databaseName,
    now: () => FIXED_NOW,
  });

  const first = await foundation.initialize();
  const second = await foundation.initialize();

  assert.equal(first, second);
  assert.equal(foundation.getConnection(), first);
  assert.equal(first.phase, 'ready');
  assert.equal(
    first.bootstrapState.metadata?.bootstrapVersion,
    TIMELINE_BOOTSTRAP_VERSION,
  );

  first.close();
  await deleteTestDatabase(databaseName);
});

test('reports storage unavailable when indexedDB is missing', async () => {
  const originalIndexedDb = globalThis.indexedDB;
  // @ts-expect-error test override
  delete globalThis.indexedDB;

  try {
    await assert.rejects(
      () =>
        openTimelineIndexedDB({
          databaseName: createTestDatabaseName('missing-idb'),
        }),
      (error) => {
        assert.ok(error instanceof TimelineRepositoryError);
        assert.equal(error.code, 'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE');
        return true;
      },
    );
  } finally {
    globalThis.indexedDB = originalIndexedDb;
  }
});

test('fails schema upgrade when database version is newer than supported', async () => {
  const databaseName = createTestDatabaseName('schema-version-newer');
  await deleteTestDatabase(databaseName);

  const request = indexedDB.open(databaseName, TIMELINE_INDEXEDDB_VERSION + 1);
  await new Promise((resolve, reject) => {
    request.onupgradeneeded = () => {
      request.result.createObjectStore('placeholder');
    };
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
  });
  request.result.close();

  await assert.rejects(
    () =>
      openTimelineIndexedDB({
        databaseName,
        now: () => FIXED_NOW,
      }),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED');
      return true;
    },
  );

  await deleteTestDatabase(databaseName);
});
