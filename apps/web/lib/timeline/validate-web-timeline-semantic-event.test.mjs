import assert from 'node:assert/strict';
import test from 'node:test';

import { NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS } from '@diabetes-universe/medical-domain';

import {
  createWebTimelineSemanticEventValidator,
  validateWebTimelineNutritionEvent,
  validateWebTimelineSemanticEvent,
} from './validate-web-timeline-semantic-event.ts';

const FIXED_NOW = '2026-08-09T19:00:00.000Z';

function nutritionV1(overrides = {}) {
  return {
    carbohydratesGrams: 42,
    createdAt: FIXED_NOW,
    id: 'nutrition-v1-1',
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
    id: 'nutrition-v2-1',
    kind: 'nutrition',
    mealType: 'breakfast',
    occurredAt: FIXED_NOW,
    schemaVersion: 2,
    source: 'manual',
    updatedAt: FIXED_NOW,
    ...overrides,
  };
}

test('web nutrition validator accepts legacy v1 and canonical v2 events', () => {
  const validator = createWebTimelineSemanticEventValidator();

  assert.equal(validator(nutritionV1()), true);
  assert.equal(
    validator(
      nutritionV1({
        mode: 'products',
        products: [
          { carbohydratesGrams: 10, name: 'Apple', productId: 'apple' },
        ],
      }),
    ),
    true,
  );
  assert.equal(validator(nutritionV2()), true);
  assert.equal(validator(nutritionV2({ carbohydratesGrams: 12.125 })), true);
  assert.equal(
    validator(
      nutritionV2({
        carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS,
      }),
    ),
    true,
  );
  assert.equal(
    validator(
      nutritionV2({
        carbohydratesGrams: 15,
        items: [
          {
            carbohydratesGrams: 10,
            itemId: 'item-1',
            name: 'Apple',
            weightGrams: 100,
            carbsPer100Grams: 14,
          },
        ],
      }),
    ),
    true,
  );
  assert.equal(
    validator(
      nutritionV2({
        carbohydratesGrams: 99,
        items: [
          {
            carbohydratesGrams: 10,
            itemId: 'item-1',
            name: 'Apple',
          },
        ],
      }),
    ),
    true,
  );
});

test('web nutrition validator rejects invalid canonical v2 events', () => {
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ mealType: 'Завтрак' })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ carbohydratesGrams: 0 })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ carbohydratesGrams: -1 })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({
        carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS + 1,
      }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({ carbohydratesGrams: Number.NaN }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({ carbohydratesGrams: Number.POSITIVE_INFINITY }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ mode: 'manual' })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ products: [] })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({ calculatedCarbsGrams: 42 }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(nutritionV2({ items: [] })),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({
        items: [
          {
            carbohydratesGrams: 10,
            itemId: '   ',
            name: 'Apple',
          },
        ],
      }),
    ),
    false,
  );
  assert.equal(
    validateWebTimelineNutritionEvent(
      nutritionV2({
        items: [
          {
            carbohydratesGrams: 10,
            itemId: 'item-1',
            name: '   ',
          },
        ],
      }),
    ),
    false,
  );
});

test('composed semantic validator accepts canonical glucose', () => {
  const validator = validateWebTimelineSemanticEvent;

  assert.equal(
    validator({
      createdAt: FIXED_NOW,
      id: 'glucose-1',
      kind: 'glucose',
      occurredAt: FIXED_NOW,
      schemaVersion: 1,
      source: 'manual',
      unit: 'mmol/L',
      updatedAt: FIXED_NOW,
      concentrationMmolPerL: 5.6,
    }),
    true,
  );
});

test('glucose persistence rejects impossible values instead of treating finite as valid', () => {
  for (const concentrationMmolPerL of [
    -5,
    0,
    0.09,
    101,
    NaN,
    Infinity,
    undefined,
  ]) {
    assert.equal(
      validateWebTimelineSemanticEvent({
        kind: 'glucose',
        concentrationMmolPerL,
      }),
      false,
    );
  }
  for (const concentrationMmolPerL of [0.1, 5.5, 40, 100]) {
    assert.equal(
      validateWebTimelineSemanticEvent({
        kind: 'glucose',
        concentrationMmolPerL,
      }),
      true,
    );
  }
});
