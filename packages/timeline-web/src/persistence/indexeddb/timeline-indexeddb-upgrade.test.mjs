import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TimelineIndexedDbSchemaUpgradeError,
  applyTimelineIndexedDbSchemaUpgrade,
} from '../../index.ts';

function createFakeDatabase(existingStores = []) {
  const createdStores = [];
  const createdIndexes = [];
  const existing = new Set(existingStores);

  return {
    createdIndexes,
    createdStores,
    database: {
      objectStoreNames: {
        contains(name) {
          return existing.has(name);
        },
      },
      createObjectStore(name, options) {
        createdStores.push({ name, keyPath: options.keyPath });

        return {
          createIndex(indexName, keyPath, indexOptions) {
            createdIndexes.push({
              keyPath,
              name: indexName,
              unique: indexOptions.unique,
            });
          },
        };
      },
    },
  };
}

test('creates the complete v1 schema', () => {
  const fake = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(fake.database, 0, 1);

  assert.deepEqual(fake.createdStores, [
    { keyPath: 'id', name: 'timeline_events' },
    { keyPath: 'key', name: 'timeline_metadata' },
    { keyPath: 'quarantineId', name: 'timeline_quarantine' },
  ]);
  assert.deepEqual(fake.createdIndexes, [
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

test('skips creation at the current version', () => {
  const fake = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(fake.database, 1, 1);

  assert.deepEqual(fake.createdStores, []);
});

test('rejects an unsupported upgrade path', () => {
  const fake = createFakeDatabase();

  assert.throws(
    () => applyTimelineIndexedDbSchemaUpgrade(fake.database, 0, 2),
    TimelineIndexedDbSchemaUpgradeError,
  );
});

test('rejects a non-fresh v1 database', () => {
  const fake = createFakeDatabase(['timeline_events']);

  assert.throws(
    () => applyTimelineIndexedDbSchemaUpgrade(fake.database, 0, 1),
    TimelineIndexedDbSchemaUpgradeError,
  );
});
