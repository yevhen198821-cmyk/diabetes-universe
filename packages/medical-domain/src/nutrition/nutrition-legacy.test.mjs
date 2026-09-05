import assert from 'node:assert/strict';
import test from 'node:test';

import {
  classifyNutritionTimelineEvent,
  isNutritionCanonicalSchemaVersion,
  isNutritionLegacySchemaVersion,
} from './nutrition-legacy.ts';
import { validateNutritionTimelineEventV2 } from './nutrition-timeline-event-v2.ts';

const legacyV1Event = {
  kind: 'nutrition',
  schemaVersion: 1,
  mode: 'products',
  mealType: 'Завтрак',
  carbohydratesGrams: 0,
  products: [
    {
      productId: 'demo-apple',
      productName: 'Яблоко',
      weightGrams: 120,
      carbsPer100Grams: 14,
      calculatedCarbsGrams: 16.8,
    },
  ],
  calculatedCarbsGrams: 16.8,
  note: 'legacy demo',
};

test('schema version guards distinguish legacy v1 from canonical v2', () => {
  assert.equal(isNutritionLegacySchemaVersion(1), true);
  assert.equal(isNutritionLegacySchemaVersion(2), false);
  assert.equal(isNutritionCanonicalSchemaVersion(2), true);
  assert.equal(isNutritionCanonicalSchemaVersion(1), false);
});

test('valid existing v1 records remain readable as legacy Nutrition events', () => {
  const classified = classifyNutritionTimelineEvent(legacyV1Event);

  assert.equal(classified.status, 'legacy_v1');
  assert.equal(
    classified.status === 'legacy_v1' && classified.record,
    legacyV1Event,
  );
  assert.equal(
    classified.status === 'legacy_v1' && classified.record.mealType,
    'Завтрак',
  );
  assert.equal(
    classified.status === 'legacy_v1' && classified.record.mode,
    'products',
  );
});

test('legacy classifier does not infer localized meal types', () => {
  const classified = classifyNutritionTimelineEvent({
    kind: 'nutrition',
    schemaVersion: 1,
    mealType: 'Frühstück',
    carbohydratesGrams: 30,
    mode: 'manual',
  });

  assert.equal(classified.status, 'legacy_v1');
  assert.equal(
    classified.status === 'legacy_v1' && classified.record.mealType,
    'Frühstück',
  );
});

test('strict v2 validator does not make a valid v1 record unreadable via classify', () => {
  const v2Result = validateNutritionTimelineEventV2(legacyV1Event);
  const classified = classifyNutritionTimelineEvent(legacyV1Event);

  assert.equal(v2Result.ok, false);
  assert.equal(classified.status, 'legacy_v1');
});

test('canonical v2 records classify as canonical_v2', () => {
  const classified = classifyNutritionTimelineEvent({
    kind: 'nutrition',
    schemaVersion: 2,
    mealType: 'snack',
    carbohydratesGrams: 12.125,
  });

  assert.deepEqual(classified, {
    status: 'canonical_v2',
    value: {
      kind: 'nutrition',
      mealType: 'snack',
      carbohydratesGrams: 12.125,
      schemaVersion: 2,
    },
  });
});

test('unknown schema versions are not treated as legacy or silently adopted', () => {
  assert.deepEqual(
    classifyNutritionTimelineEvent({
      kind: 'nutrition',
      schemaVersion: 3,
      mealType: 'lunch',
      carbohydratesGrams: 20,
    }),
    { status: 'invalid', error: 'nutrition.schema_version.invalid' },
  );
});

test('non-nutrition kinds are not classified as Nutrition events', () => {
  assert.deepEqual(
    classifyNutritionTimelineEvent({
      kind: 'food',
      schemaVersion: 2,
      mealType: 'lunch',
      carbohydratesGrams: 20,
    }),
    { status: 'invalid', error: 'nutrition.kind.invalid' },
  );
});
