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

test('creates the complete v2 schema on fresh install', () => {
  const fake = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(fake.database, 0, 2);

  assert.deepEqual(fake.createdStores, [
    { keyPath: 'id', name: 'timeline_events' },
    { keyPath: 'key', name: 'timeline_metadata' },
    { keyPath: 'quarantineId', name: 'timeline_quarantine' },
    { keyPath: 'localEventId', name: 'timeline_adoption_acknowledgements' },
    { keyPath: 'clientAdoptionRunId', name: 'timeline_adoption_sessions' },
    { keyPath: 'quarantineId', name: 'timeline_adoption_quarantine' },
  ]);
});

test('skips creation at the current version', () => {
  const fake = createFakeDatabase();

  applyTimelineIndexedDbSchemaUpgrade(fake.database, 2, 2);

  assert.deepEqual(fake.createdStores, []);
});

test('upgrades v1 to v2 additively', () => {
  const fake = createFakeDatabase([
    'timeline_events',
    'timeline_metadata',
    'timeline_quarantine',
  ]);

  applyTimelineIndexedDbSchemaUpgrade(fake.database, 1, 2);

  assert.deepEqual(fake.createdStores, [
    { keyPath: 'localEventId', name: 'timeline_adoption_acknowledgements' },
    { keyPath: 'clientAdoptionRunId', name: 'timeline_adoption_sessions' },
    { keyPath: 'quarantineId', name: 'timeline_adoption_quarantine' },
  ]);
});

test('rejects a non-fresh v1 database', () => {
  const fake = createFakeDatabase(['timeline_events']);

  assert.throws(
    () => applyTimelineIndexedDbSchemaUpgrade(fake.database, 0, 2),
    TimelineIndexedDbSchemaUpgradeError,
  );
});
