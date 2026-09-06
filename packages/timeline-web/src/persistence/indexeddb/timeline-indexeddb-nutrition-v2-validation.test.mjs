import assert from 'node:assert/strict';
import test from 'node:test';

import { validateIndexedDbTimelineEventRecord } from './timeline-indexeddb-validation.ts';

const NOW = '2026-09-05T08:00:00.000Z';

function wrap(event) {
  return {
    event,
    id: event.id,
    kind: event.kind,
    occurredAt: event.occurredAt,
    persistedAt: NOW,
    storageSchemaVersion: 1,
  };
}

function nutritionV1(overrides = {}) {
  return {
    carbohydratesGrams: 42,
    createdAt: NOW,
    id: 'nutrition-v1-1',
    kind: 'nutrition',
    mealType: 'Завтрак',
    mode: 'manual',
    occurredAt: NOW,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: NOW,
    ...overrides,
  };
}

function nutritionV2(overrides = {}) {
  return {
    carbohydratesGrams: 12.12,
    createdAt: NOW,
    id: 'nutrition-v2-1',
    kind: 'nutrition',
    mealType: 'breakfast',
    occurredAt: NOW,
    schemaVersion: 2,
    source: 'manual',
    updatedAt: NOW,
    ...overrides,
  };
}

function glucose(overrides = {}) {
  return {
    concentrationMmolPerL: 6.4,
    createdAt: NOW,
    id: 'glucose-1',
    kind: 'glucose',
    occurredAt: NOW,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: NOW,
    ...overrides,
  };
}

function insulin(overrides = {}) {
  return {
    createdAt: NOW,
    doseUnits: 4,
    id: 'insulin-1',
    kind: 'insulin',
    occurredAt: NOW,
    preparation: 'NovoRapid',
    schemaVersion: 1,
    source: 'manual',
    updatedAt: NOW,
    ...overrides,
  };
}

test('legacy Nutrition v1 remains structurally valid', () => {
  const result = validateIndexedDbTimelineEventRecord(wrap(nutritionV1()));

  assert.equal(result.status, 'ok');
});

test('legacy Nutrition v1 product rows remain structurally valid', () => {
  const result = validateIndexedDbTimelineEventRecord(
    wrap(
      nutritionV1({
        mode: 'products',
        products: [
          {
            calculatedCarbsGrams: 14,
            carbsPer100Grams: 14,
            productId: 'apple',
            productName: 'Яблоко',
            weightGrams: 100,
          },
        ],
      }),
    ),
  );

  assert.equal(result.status, 'ok');
});

test('canonical Nutrition v2 is accepted without mode or products', () => {
  const result = validateIndexedDbTimelineEventRecord(wrap(nutritionV2()));

  assert.equal(result.status, 'ok');
  if (result.status === 'ok') {
    assert.equal(result.record.event.schemaVersion, 2);
    assert.equal(Object.hasOwn(result.record.event, 'mode'), false);
    assert.equal(Object.hasOwn(result.record.event, 'products'), false);
  }
});

test('canonical Nutrition v2 item snapshots are accepted', () => {
  const result = validateIndexedDbTimelineEventRecord(
    wrap(
      nutritionV2({
        items: [
          {
            carbohydratesGrams: 12.12,
            carbsPer100Grams: 12.12,
            itemId: 'nutrition-item-1',
            name: 'Apple',
            weightGrams: 100,
          },
        ],
      }),
    ),
  );

  assert.equal(result.status, 'ok');
});

test('existing Glucose v1 remains valid', () => {
  assert.equal(
    validateIndexedDbTimelineEventRecord(wrap(glucose())).status,
    'ok',
  );
});

test('existing Insulin v1 remains valid', () => {
  assert.equal(
    validateIndexedDbTimelineEventRecord(wrap(insulin())).status,
    'ok',
  );
});

test('unknown schema versions are not silently accepted', () => {
  assert.equal(
    validateIndexedDbTimelineEventRecord(
      wrap(nutritionV2({ schemaVersion: 3 })),
    ).status,
    'quarantine',
  );
  assert.equal(
    validateIndexedDbTimelineEventRecord(wrap(glucose({ schemaVersion: 2 })))
      .status,
    'quarantine',
  );
  assert.equal(
    validateIndexedDbTimelineEventRecord(wrap(insulin({ schemaVersion: 2 })))
      .status,
    'quarantine',
  );
});

test('Nutrition v2 rejects an empty items array', () => {
  const result = validateIndexedDbTimelineEventRecord(
    wrap(nutritionV2({ items: [] })),
  );

  assert.equal(result.status, 'quarantine');
});
