import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import {
  TIMELINE_INDEXEDDB_STORES,
  createIndexedDbTimelineRepository,
} from '../../index.ts';

const FIXED_NOW = '2026-08-09T19:00:00.000Z';
const CANONICAL_DOSE_MAXIMUM = 500;
const VALID_PREPARATION_IDS = new Set([
  'insulin.prep.aspart_novorapid',
  'insulin.prep.aspart_fiasp',
  'insulin.prep.lispro_humalog',
  'insulin.prep.glulisine_apidra',
  'insulin.prep.glargine_lantus',
  'insulin.prep.degludec_tresiba',
  'insulin.prep.other',
]);
const VALID_ADMINISTRATION_CONTEXTS = new Set([
  'before_meal',
  'after_meal',
  'correction',
  'basal',
  'other',
  'unspecified',
]);

function insulinEvent(overrides = {}) {
  return {
    createdAt: FIXED_NOW,
    doseUnits: 4,
    id: 'insulin-1',
    kind: 'insulin',
    occurredAt: FIXED_NOW,
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.aspart_novorapid',
    administrationContext: 'correction',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

function createTestInsulinSemanticEventValidator() {
  return (event) => {
    if (event.kind !== 'insulin') {
      return true;
    }

    if (
      typeof event.preparation !== 'string' ||
      event.preparation.trim().length === 0
    ) {
      return false;
    }

    if (
      typeof event.doseUnits !== 'number' ||
      !Number.isFinite(event.doseUnits) ||
      event.doseUnits <= 0 ||
      event.doseUnits > CANONICAL_DOSE_MAXIMUM
    ) {
      return false;
    }

    if (event.preparationId !== undefined) {
      if (!VALID_PREPARATION_IDS.has(event.preparationId)) {
        return false;
      }

      if (
        event.preparationId === 'insulin.prep.other' &&
        event.preparation.trim().length === 0
      ) {
        return false;
      }
    }

    if (
      event.administrationContext !== undefined &&
      !VALID_ADMINISTRATION_CONTEXTS.has(event.administrationContext)
    ) {
      return false;
    }

    return true;
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

test('indexeddb repository rejects malformed insulin writes before durable commit', async () => {
  const databaseName = `wave-4f-insulin-write-${Date.now()}`;
  const repository = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createTestInsulinSemanticEventValidator(),
  });

  await repository.initialize();

  for (const event of [
    insulinEvent({ doseUnits: 0, id: 'insulin-zero' }),
    insulinEvent({ doseUnits: -2, id: 'insulin-negative' }),
    insulinEvent({ doseUnits: 501, id: 'insulin-over-max' }),
    insulinEvent({
      id: 'insulin-unmapped',
      preparationId: 'insulin.prep.unmapped',
    }),
    insulinEvent({
      administrationContext: 'Перед едой',
      id: 'insulin-bad-context',
    }),
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

test('indexeddb repository persists valid canonical insulin doses', async () => {
  const databaseName = `wave-4f-insulin-valid-${Date.now()}`;
  const repository = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createTestInsulinSemanticEventValidator(),
  });

  await repository.initialize();

  for (const doseUnits of [125, 12.125, CANONICAL_DOSE_MAXIMUM]) {
    const event = insulinEvent({ doseUnits, id: `insulin-${doseUnits}` });
    assert.deepEqual(await repository.addEvent(event), { status: 'applied' });
    assert.equal((await repository.getById(event.id))?.doseUnits, doseUnits);
  }

  const legacyEvent = insulinEvent({
    administrationContext: undefined,
    id: 'insulin-legacy',
    preparationId: undefined,
  });

  assert.deepEqual(await repository.addEvent(legacyEvent), {
    status: 'applied',
  });
  assert.equal(
    (await repository.getById('insulin-legacy'))?.preparation,
    'NovoRapid',
  );

  repository.close();
  await deleteTestDatabase(databaseName);
});

test('indexeddb repository quarantines malformed seeded insulin on read', async () => {
  const databaseName = `wave-4f-insulin-quarantine-${Date.now()}`;
  const repository = createIndexedDbTimelineRepository({
    databaseName,
    semanticEventValidator: createTestInsulinSemanticEventValidator(),
  });

  await repository.initialize();
  repository.close();

  const raw = {
    event: insulinEvent({ doseUnits: 0 }),
    id: 'insulin-bad',
    kind: 'insulin',
    occurredAt: FIXED_NOW,
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
    semanticEventValidator: createTestInsulinSemanticEventValidator(),
  });
  await reopened.initialize();

  await assert.rejects(
    () => reopened.getById('insulin-bad'),
    (error) => {
      assert.ok(error instanceof TimelineRepositoryError);
      assert.equal(error.code, 'TIMELINE_REPOSITORY_READ_FAILED');
      return true;
    },
  );

  reopened.close();
  await deleteTestDatabase(databaseName);
});
