import assert from 'node:assert/strict';
import test from 'node:test';

import { NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS } from './nutrition-constants.ts';
import { NUTRITION_MEAL_TYPES } from './nutrition-meal-type.ts';
import { validateNutritionTimelineEventV2 } from './nutrition-timeline-event-v2.ts';

function canonicalEvent(overrides = {}) {
  return {
    kind: 'nutrition',
    mealType: 'breakfast',
    carbohydratesGrams: 42,
    schemaVersion: 2,
    ...overrides,
  };
}

test('every canonical meal type is valid on a v2 event', () => {
  for (const mealType of NUTRITION_MEAL_TYPES) {
    const result = validateNutritionTimelineEventV2(
      canonicalEvent({ mealType }),
    );

    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.mealType, mealType);
  }
});

test('localized and arbitrary meal types are invalid on a v2 event', () => {
  for (const mealType of ['Breakfast', 'Завтрак', 'Frühstück', 'arbitrary']) {
    assert.deepEqual(
      validateNutritionTimelineEventV2(canonicalEvent({ mealType })),
      {
        ok: false,
        error: 'nutrition.meal_type.invalid',
      },
    );
  }
});

test('total-carbs-only v2 event omits items', () => {
  const result = validateNutritionTimelineEventV2(canonicalEvent());

  assert.deepEqual(result, {
    ok: true,
    value: {
      kind: 'nutrition',
      mealType: 'breakfast',
      carbohydratesGrams: 42,
      schemaVersion: 2,
    },
  });
  assert.equal(result.ok && 'items' in result.value, false);
});

test('itemized v2 event keeps historical snapshots and the authoritative total', () => {
  const result = validateNutritionTimelineEventV2(
    canonicalEvent({
      carbohydratesGrams: 15,
      items: [
        {
          itemId: 'a',
          name: 'Bread',
          carbohydratesGrams: 10,
        },
        {
          itemId: 'b',
          name: 'Apple',
          carbohydratesGrams: 12.125,
        },
      ],
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.carbohydratesGrams, 15);
  assert.equal(result.ok && result.value.items?.length, 2);
  assert.equal(
    result.ok && Object.is(result.value.items?.[1]?.carbohydratesGrams, 12.125),
    true,
  );
});

test('empty items array is invalid for canonical v2', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(canonicalEvent({ items: [] })),
    {
      ok: false,
      error: 'nutrition.items.empty',
    },
  );
});

test('non-array items are invalid for canonical v2', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({ items: { itemId: 'a' } }),
    ),
    { ok: false, error: 'nutrition.items.not_an_array' },
  );
});

test('v2 validator does not recompute or repair a total mismatch', () => {
  const result = validateNutritionTimelineEventV2(
    canonicalEvent({
      carbohydratesGrams: 8,
      items: [
        {
          itemId: 'a',
          name: 'Bread',
          carbohydratesGrams: 20,
          weightGrams: 100,
          carbsPer100Grams: 50,
        },
      ],
    }),
  );

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.carbohydratesGrams, 8);
  assert.equal(result.ok && result.value.items?.[0]?.carbohydratesGrams, 20);
});

test('v2 validator rejects legacy Nutrition fields instead of adopting them', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        mode: 'manual',
      }),
    ),
    { ok: false, error: 'nutrition.legacy_field.not_allowed' },
  );
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        products: [],
      }),
    ),
    { ok: false, error: 'nutrition.legacy_field.not_allowed' },
  );
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        calculatedCarbsGrams: 12,
      }),
    ),
    { ok: false, error: 'nutrition.legacy_field.not_allowed' },
  );
});

test('v2 validator rejects a schemaVersion 1 record', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        schemaVersion: 1,
        mode: 'manual',
        mealType: 'Завтрак',
      }),
    ),
    { ok: false, error: 'nutrition.schema_version.invalid' },
  );
});

test('v2 carbohydrates follow the canonical numeric contract', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(canonicalEvent({ carbohydratesGrams: 0 })),
    { ok: false, error: 'nutrition.carbohydrates.not_positive' },
  );
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({ carbohydratesGrams: -3 }),
    ),
    { ok: false, error: 'nutrition.carbohydrates.not_positive' },
  );
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({ carbohydratesGrams: Number.NaN }),
    ),
    { ok: false, error: 'nutrition.carbohydrates.not_finite' },
  );
  assert.deepEqual(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS + 1,
      }),
    ),
    { ok: false, error: 'nutrition.carbohydrates.above_technical_maximum' },
  );
  assert.equal(
    validateNutritionTimelineEventV2(
      canonicalEvent({
        carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS,
      }),
    ).ok,
    true,
  );
});

test('v2 note is optional and omitted when blank', () => {
  const withNote = validateNutritionTimelineEventV2(
    canonicalEvent({ note: '  leftover pizza  ' }),
  );
  const blankNote = validateNutritionTimelineEventV2(
    canonicalEvent({ note: '   ' }),
  );

  assert.equal(withNote.ok && withNote.value.note, 'leftover pizza');
  assert.equal(blankNote.ok && 'note' in blankNote.value, false);
  assert.deepEqual(
    validateNutritionTimelineEventV2(canonicalEvent({ note: 12 })),
    { ok: false, error: 'nutrition.note.invalid' },
  );
});

test('v2 validator requires kind nutrition', () => {
  assert.deepEqual(
    validateNutritionTimelineEventV2(canonicalEvent({ kind: 'meal' })),
    { ok: false, error: 'nutrition.kind.invalid' },
  );
  assert.deepEqual(validateNutritionTimelineEventV2(null), {
    ok: false,
    error: 'nutrition.input.invalid',
  });
});
