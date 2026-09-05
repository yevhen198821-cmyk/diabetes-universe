import assert from 'node:assert/strict';
import test from 'node:test';

import { NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS } from './nutrition-constants.ts';
import { validateNutritionItemSnapshot } from './nutrition-item-snapshot.ts';

test('item snapshot accepts a minimal valid historical item', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 12.125,
    }),
    {
      ok: true,
      value: {
        itemId: 'item-1',
        name: 'Bread',
        carbohydratesGrams: 12.125,
      },
    },
  );
});

test('item snapshot keeps arbitrary decimal precision without rounding', () => {
  const carbohydratesGrams = 12.125;
  const result = validateNutritionItemSnapshot({
    itemId: 'item-precision',
    name: 'Oats',
    carbohydratesGrams,
    weightGrams: 37.5,
    carbsPer100Grams: 32.333,
  });

  assert.equal(result.ok, true);
  assert.equal(
    result.ok && Object.is(result.value.carbohydratesGrams, 12.125),
    true,
  );
  assert.equal(result.ok && Object.is(result.value.weightGrams, 37.5), true);
  assert.equal(
    result.ok && Object.is(result.value.carbsPer100Grams, 32.333),
    true,
  );
});

test('item snapshot rejects empty itemId', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: '',
      name: 'Bread',
      carbohydratesGrams: 10,
    }),
    { ok: false, error: 'nutrition.item.item_id.empty' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: '   ',
      name: 'Bread',
      carbohydratesGrams: 10,
    }),
    { ok: false, error: 'nutrition.item.item_id.empty' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      name: 'Bread',
      carbohydratesGrams: 10,
    }),
    { ok: false, error: 'nutrition.item.item_id.empty' },
  );
});

test('item snapshot rejects whitespace-only name', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: '   ',
      carbohydratesGrams: 10,
    }),
    { ok: false, error: 'nutrition.item.name.empty' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: '',
      carbohydratesGrams: 10,
    }),
    { ok: false, error: 'nutrition.item.name.empty' },
  );
});

test('item snapshot trims a display name without using it as identity', () => {
  const result = validateNutritionItemSnapshot({
    itemId: 'opaque-id',
    name: '  Rye bread  ',
    carbohydratesGrams: 18,
  });

  assert.deepEqual(result, {
    ok: true,
    value: {
      itemId: 'opaque-id',
      name: 'Rye bread',
      carbohydratesGrams: 18,
    },
  });
});

test('item snapshot rejects zero, negative, and non-finite carbohydrates', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 0,
    }),
    { ok: false, error: 'nutrition.carbohydrates.not_positive' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: -4,
    }),
    { ok: false, error: 'nutrition.carbohydrates.not_positive' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: Number.NaN,
    }),
    { ok: false, error: 'nutrition.carbohydrates.not_finite' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: Number.POSITIVE_INFINITY,
    }),
    { ok: false, error: 'nutrition.carbohydrates.not_finite' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS + 1,
    }),
    { ok: false, error: 'nutrition.carbohydrates.above_technical_maximum' },
  );
});

test('item snapshot rejects invalid optional weight', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      weightGrams: 0,
    }),
    { ok: false, error: 'nutrition.item.weight_grams.invalid' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      weightGrams: -1,
    }),
    { ok: false, error: 'nutrition.item.weight_grams.invalid' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      weightGrams: Number.NaN,
    }),
    { ok: false, error: 'nutrition.item.weight_grams.invalid' },
  );
});

test('item snapshot rejects invalid optional carbs-per-100', () => {
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      carbsPer100Grams: 0,
    }),
    { ok: false, error: 'nutrition.item.carbs_per_100_grams.invalid' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      carbsPer100Grams: -8,
    }),
    { ok: false, error: 'nutrition.item.carbs_per_100_grams.invalid' },
  );
  assert.deepEqual(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
      carbsPer100Grams: Number.NaN,
    }),
    { ok: false, error: 'nutrition.item.carbs_per_100_grams.invalid' },
  );
});

test('item snapshot does not recompute carbs from weight and carbs-per-100', () => {
  const result = validateNutritionItemSnapshot({
    itemId: 'item-1',
    name: 'Bread',
    carbohydratesGrams: 9,
    weightGrams: 100,
    carbsPer100Grams: 50,
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.carbohydratesGrams, 9);
});

test('item snapshot does not treat productId as catalogue identity', () => {
  const result = validateNutritionItemSnapshot({
    itemId: 'snapshot-id',
    name: 'Demo apple',
    carbohydratesGrams: 14,
    productId: 'demo-product-apple',
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.value.itemId, 'snapshot-id');
  assert.equal(result.ok && 'productId' in result.value, false);
});

test('item snapshot rejects a non-record root', () => {
  assert.deepEqual(validateNutritionItemSnapshot(null), {
    ok: false,
    error: 'nutrition.item.input.invalid',
  });
  assert.deepEqual(validateNutritionItemSnapshot([]), {
    ok: false,
    error: 'nutrition.item.input.invalid',
  });
});
