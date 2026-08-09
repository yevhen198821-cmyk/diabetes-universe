import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TimelineIndexedDbSchemaUpgradeError,
  applyTimelineIndexedDbSchemaUpgrade,
} from '../../index.ts';

function createFakeDatabase() {
  const stores = new Map();

  return {
    database: {
      objectStoreNames: {
        contains(name) {
          return stores.has(name);
        },
      },
      createObjectStore(name, options) {
        if (stores.has(name)) {
          throw new Error(`duplicate store: ${name}`);
        }

        const indexes = [];
        const store = {
          indexes,
          keyPath: options.keyPath,
          name,
          createIndex(indexName, keyPath, indexOptions) {
            indexes.push({
              keyPath,
              name: indexName,
              unique: indexOptions.unique,
            });
          },
        };
        stores.set(name, store);
        return store;
      },
    },
    stores,
  };
}

test('creates the complete v1 schema from a fresh database', () => {
  const { database, stores } = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(database, 0, 1);

  assert.deepEqual([...stores.keys()], [
    'timeline_events',
    'timeline_metadata',
    'timeline_quarantine',
  ]);
  assert.equal(stores.get('timeline_events').keyPath, 'id');
  assert.deepEqual(stores.get('timeline_events').indexes, [
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
  assert.equal(stores.get('timeline_metadata').keyPath, 'key');
  assert.equal(
    stores.get('timeline_quarantine').keyPath,
    'quarantineId',
  );
});

test('does not recreate schema when already at the current version', () => {
  const { database, stores } = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(database, 1, 1);

  assert.equal(stores.size, 0);
});

test('rejects unsupported upgrade paths deterministically', () => {
  const { database } = createFakeDatabase();

  assert.throws(
    () => applyTimelineIndexedDbSchemaUpgrade(database, 0, 2),
    TimelineIndexedDbSchemaUpgradeError,
  );
});

test('rejects a non-fresh database during v1 creation', () => {
  const { database } = createFakeDatabase();
  database.createObjectStore('timeline_events', { keyPath: 'id' });

  assert.throws(
    () => applyTimelineIndexedDbSchemaUpgrade(database, 0, 1),
    TimelineIndexedDbSchemaUpgradeError,
  );
});
