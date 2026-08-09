import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  TIMELINE_INDEXEDDB_STORES,
  createIndexedDbTimelineRepository,
} from '../../index.ts';

const FIXED_NOW = '2026-08-09T19:00:00.000Z';

function createTestDatabaseName(testName) {
  return `diabetes-universe-timeline-repo-${testName}`;
}

async function deleteTestDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

function glucose(id, occurredAt) {
  return {
    concentrationMmolPerL: 6.4,
    createdAt: occurredAt,
    id,
    kind: 'glucose',
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: occurredAt,
  };
}

function insulin(id, occurredAt) {
  return {
    createdAt: occurredAt,
    doseUnits: 4,
    id,
    kind: 'insulin',
    occurredAt,
    preparation: 'NovoRapid',
    schemaVersion: 1,
    source: 'demo',
    updatedAt: occurredAt,
  };
}

async function createReadyRepository(testName) {
  const databaseName = createTestDatabaseName(testName);
  await deleteTestDatabase(databaseName);

  const repository = createIndexedDbTimelineRepository({ databaseName });
  await repository.initialize();
  return { databaseName, repository };
}

test('round-trip write and getById', async () => {
  const { databaseName, repository } =
    await createReadyRepository('round-trip');
  const event = glucose('g1', '2026-08-09T08:00:00.000Z');

  await repository.addEvent(event);
  const loaded = await repository.getById('g1');

  assert.deepEqual(loaded, event);
  assert.equal(await repository.getById('missing'), null);

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('queryEvents supports asc pagination, kind filters, and occurrence ranges', async () => {
  const { databaseName, repository } = await createReadyRepository('query');

  await repository.replaceEvents([
    glucose('g1', '2026-08-09T08:00:00.000Z'),
    insulin('i1', '2026-08-09T08:10:00.000Z'),
    glucose('g2', '2026-08-09T08:20:00.000Z'),
    insulin('i2', '2026-08-09T08:30:00.000Z'),
  ]);

  const first = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-asc',
  });
  const second = await repository.queryEvents({
    cursor: first.nextCursor,
    limit: 2,
    order: 'occurredAt-asc',
  });
  const glucoseOnly = await repository.queryEvents({
    kinds: ['glucose'],
    limit: 10,
    order: 'occurredAt-asc',
  });
  const ranged = await repository.queryEvents({
    limit: 10,
    occurredFrom: '2026-08-09T08:10:00.000Z',
    occurredTo: '2026-08-09T08:30:00.000Z',
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    first.events.map((event) => event.id),
    ['g1', 'i1'],
  );
  assert.deepEqual(
    second.events.map((event) => event.id),
    ['g2', 'i2'],
  );
  assert.deepEqual(
    glucoseOnly.events.map((event) => event.id),
    ['g1', 'g2'],
  );
  assert.deepEqual(
    ranged.events.map((event) => event.id),
    ['i1', 'g2'],
  );

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('queryEvents supports descending order', async () => {
  const { databaseName, repository } = await createReadyRepository('desc');

  await repository.replaceEvents([
    glucose('g1', '2026-08-09T08:00:00.000Z'),
    insulin('i1', '2026-08-09T08:10:00.000Z'),
    glucose('g2', '2026-08-09T08:20:00.000Z'),
    insulin('i2', '2026-08-09T08:30:00.000Z'),
  ]);

  const result = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-desc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['i2', 'g2'],
  );

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('update and delete follow repository mutation semantics', async () => {
  const { databaseName, repository } = await createReadyRepository('mutations');

  await repository.addEvent(glucose('g1', '2026-08-09T08:00:00.000Z'));

  assert.deepEqual(
    await repository.updateEvent(glucose('missing', FIXED_NOW)),
    {
      status: 'not-found',
    },
  );
  assert.deepEqual(await repository.deleteEvent('missing'), {
    status: 'not-found',
  });

  const updated = {
    ...glucose('g1', '2026-08-09T08:05:00.000Z'),
    concentrationMmolPerL: 7.1,
  };
  assert.deepEqual(await repository.updateEvent(updated), {
    status: 'applied',
  });
  assert.deepEqual(await repository.getById('g1'), updated);

  assert.deepEqual(await repository.deleteEvent('g1'), { status: 'applied' });
  assert.equal(await repository.getById('g1'), null);

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('addEvent replaces duplicate ids', async () => {
  const { databaseName, repository } = await createReadyRepository('duplicate');

  const first = glucose('g1', '2026-08-09T08:00:00.000Z');
  const second = {
    ...first,
    concentrationMmolPerL: 8.2,
    occurredAt: '2026-08-09T08:05:00.000Z',
  };

  await repository.addEvent(first);
  await repository.addEvent(second);

  assert.deepEqual(await repository.getById('g1'), second);

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('initialize is idempotent for the same repository instance', async () => {
  const databaseName = createTestDatabaseName('initialize-idempotent');
  await deleteTestDatabase(databaseName);

  const repository = createIndexedDbTimelineRepository({ databaseName });
  await repository.initialize();
  await repository.addEvent(glucose('g1', FIXED_NOW));
  await repository.initialize();

  assert.deepEqual(await repository.getById('g1'), glucose('g1', FIXED_NOW));

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('fails initialize when bootstrap metadata is inconsistent with event evidence', async () => {
  const databaseName = createTestDatabaseName('bootstrap-inconsistent');
  await deleteTestDatabase(databaseName);

  const request = indexedDB.open(databaseName, 1);
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
    const openRequest = indexedDB.open(databaseName, 1);
    openRequest.onsuccess = () => resolve(openRequest.result);
    openRequest.onerror = () => reject(openRequest.error);
  });

  const writeTx = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readwrite',
  );
  writeTx.objectStore(TIMELINE_INDEXEDDB_STORES.events).put({
    event: glucose('g1', FIXED_NOW),
    id: 'g1',
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

  const repository = createIndexedDbTimelineRepository({ databaseName });

  await assert.rejects(
    () => repository.initialize(),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT');
      return true;
    },
  );

  await assert.rejects(
    () => repository.getById('g1'),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_NOT_INITIALIZED');
      return true;
    },
  );

  await deleteTestDatabase(databaseName);
});

test('reports storage unavailable when indexedDB is missing', async () => {
  const originalIndexedDb = globalThis.indexedDB;
  // @ts-expect-error test override
  delete globalThis.indexedDB;

  try {
    const repository = createIndexedDbTimelineRepository({
      databaseName: createTestDatabaseName('missing-idb'),
    });

    await assert.rejects(
      () => repository.initialize(),
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

test('queryEvents rejects invalid cursors', async () => {
  const { databaseName, repository } = await createReadyRepository('cursor');

  await repository.addEvent(glucose('g1', FIXED_NOW));

  await assert.rejects(
    () =>
      repository.queryEvents({
        cursor: 'invalid',
        limit: 1,
        order: 'occurredAt-asc',
      }),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_INVALID_CURSOR');
      return true;
    },
  );

  repository.close();
  await deleteTestDatabase(databaseName);
});
