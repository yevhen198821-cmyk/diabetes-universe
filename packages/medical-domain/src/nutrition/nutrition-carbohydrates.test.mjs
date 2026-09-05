import assert from 'node:assert/strict';
import test from 'node:test';

import { NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS } from './nutrition-constants.ts';
import { validateNutritionCanonicalCarbohydratesGrams } from './nutrition-carbohydrates.ts';

test('canonical carbohydrates accept the technical boundary and representative fractions', () => {
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(0.1), {
    ok: true,
    carbohydratesGrams: 0.1,
  });
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(12.125), {
    ok: true,
    carbohydratesGrams: 12.125,
  });
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(500), {
    ok: true,
    carbohydratesGrams: 500,
  });
  assert.deepEqual(
    validateNutritionCanonicalCarbohydratesGrams(
      NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS,
    ),
    {
      ok: true,
      carbohydratesGrams: NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS,
    },
  );
});

test('canonical carbohydrates keep arbitrary decimal precision without rounding', () => {
  const value = 12.125;
  const result = validateNutritionCanonicalCarbohydratesGrams(value);

  assert.deepEqual(result, { ok: true, carbohydratesGrams: 12.125 });
  assert.equal(result.ok && result.carbohydratesGrams, value);
  assert.equal(result.ok && Object.is(result.carbohydratesGrams, value), true);
});

test('canonical carbohydrates reject zero, negative, over-maximum, and non-finite values', () => {
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(0), {
    ok: false,
    error: 'nutrition.carbohydrates.not_positive',
  });
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(-1), {
    ok: false,
    error: 'nutrition.carbohydrates.not_positive',
  });
  assert.deepEqual(
    validateNutritionCanonicalCarbohydratesGrams(
      NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS + 0.0001,
    ),
    {
      ok: false,
      error: 'nutrition.carbohydrates.above_technical_maximum',
    },
  );
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(Number.NaN), {
    ok: false,
    error: 'nutrition.carbohydrates.not_finite',
  });
  assert.deepEqual(
    validateNutritionCanonicalCarbohydratesGrams(Number.POSITIVE_INFINITY),
    {
      ok: false,
      error: 'nutrition.carbohydrates.not_finite',
    },
  );
  assert.deepEqual(
    validateNutritionCanonicalCarbohydratesGrams(Number.NEGATIVE_INFINITY),
    {
      ok: false,
      error: 'nutrition.carbohydrates.not_finite',
    },
  );
});

test('canonical carbohydrates reject non-number runtime values', () => {
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams('12'), {
    ok: false,
    error: 'nutrition.carbohydrates.not_a_number',
  });
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(null), {
    ok: false,
    error: 'nutrition.carbohydrates.not_a_number',
  });
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(undefined), {
    ok: false,
    error: 'nutrition.carbohydrates.not_a_number',
  });
});

test('canonical carbohydrates validation is deterministic', () => {
  const first = validateNutritionCanonicalCarbohydratesGrams(3.14159);
  const second = validateNutritionCanonicalCarbohydratesGrams(3.14159);

  assert.deepEqual(first, second);
  assert.equal(first.ok && first.carbohydratesGrams, 3.14159);
});

test('500 g is valid in the domain and is not a presentation ceiling', () => {
  const result = validateNutritionCanonicalCarbohydratesGrams(500);

  assert.equal(result.ok, true);
  assert.equal(result.ok && result.carbohydratesGrams, 500);
});
