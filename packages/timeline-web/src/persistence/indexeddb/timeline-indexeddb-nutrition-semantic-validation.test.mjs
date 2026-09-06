import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import { createWebTimelineSemanticEventValidator } from '../../../../../apps/web/lib/timeline/validate-web-timeline-semantic-event.ts';
import {
  TIMELINE_INDEXEDDB_STORES,
  createIndexedDbTimelineRepository,
} from '../../index.ts';

const FIXED_NOW = '2026-09-05T08:00:00.000Z';

function nutritionV1(overrides = {}) {
  return {
    carbohydratesGrams: 42,
    createdAt: FIXED_NOW,
    id: 'nutrition-v1-neighbour',
    kind: 'nutrition',
    mealType: 'Завтрак',
    mode: 'manual',
    occurredAt: FIXED_NOW,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

function nutritionV2(overrides = {}) {
  return {
    carbohydratesGrams: 42,
    createdAt: FIXED_NOW,
    id: 'nutrition-v2-neighbour',
    kind: 'nutrition',
    mealType: 'breakfast',
    occurredAt: FIXED_NOW,
    schemaVersion: 2,
    source: 'manual',
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

async function deleteTestDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

test('indexeddb repository rejects invalid nutrition v2 writes before durable commit', async () => {
  const databaseName = `wave-6c-nutrition-write-${Date.now()}`;
  const repository = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createWebTimelineSemanticEventValidator(),
  });

  await repository.initialize();

  for (const event of [
    nutritionV2({ carbohydratesGrams: 0, id: 'nutrition-zero' }),
    nutritionV2({ mealType: 'Завтрак', id: 'nutrition-localized-meal' }),
    nutritionV2({ mode: 'manual', id: 'nutrition-legacy-mode' }),
    nutritionV2({ items: [], id: 'nutrition-empty-items' }),
  ]) {
    await assert.rejects(
      () => repository.addEvent(event),
      (error) => {
        assert.ok(error instanceof TimelineRepositoryError);
        assert.equal(error.code, 'TIMELINE_REPOSITORY_WRITE_FAILED');
        return true;
      },
    );
    assert.equal(await repository.getById(event.id), null);
  }

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('indexeddb repository quarantines seeded invalid nutrition v2 on read', async () => {
  const databaseName = `wave-6c-nutrition-quarantine-${Date.now()}`;
  const repository = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createWebTimelineSemanticEventValidator(),
  });

  await repository.initialize();
  assert.deepEqual(await repository.addEvent(nutritionV1()), {
    status: 'applied',
  });
  assert.deepEqual(await repository.addEvent(nutritionV2()), {
    status: 'applied',
  });
  repository.close();

  const invalid = nutritionV2({ id: 'nutrition-bad', mealType: 'Завтрак' });
  const raw = {
    event: invalid,
    id: invalid.id,
    kind: invalid.kind,
    occurredAt: invalid.occurredAt,
    persistedAt: FIXED_NOW,
    storageSchemaVersion: 1,
  };

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const transaction = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readwrite',
  );
  transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events).put(raw);
  await new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(undefined);
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();

  const reopened = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createWebTimelineSemanticEventValidator(),
  });
  await reopened.initialize();

  await assert.rejects(
    () => reopened.getById('nutrition-bad'),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_READ_FAILED');
      return true;
    },
  );

  const v1Neighbour = await reopened.getById('nutrition-v1-neighbour');
  const v2Neighbour = await reopened.getById('nutrition-v2-neighbour');

  assert.equal(v1Neighbour?.id, 'nutrition-v1-neighbour');
  assert.equal(v1Neighbour?.schemaVersion, 1);
  assert.equal(v2Neighbour?.id, 'nutrition-v2-neighbour');
  assert.equal(v2Neighbour?.schemaVersion, 2);

  reopened.close();
  await deleteTestDatabase(databaseName);
});
