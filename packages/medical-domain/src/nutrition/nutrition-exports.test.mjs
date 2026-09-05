import assert from 'node:assert/strict';
import test from 'node:test';

import * as medicalDomain from '../index.ts';
import {
  NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS,
  NUTRITION_KIND,
  NUTRITION_LEGACY_SCHEMA_VERSION,
  NUTRITION_MEAL_TYPES,
  NUTRITION_SCHEMA_VERSION,
  classifyNutritionTimelineEvent,
  isNutritionMealType,
  validateNutritionCanonicalCarbohydratesGrams,
  validateNutritionItemSnapshot,
  validateNutritionTimelineEventV2,
} from '../index.ts';

test('public root exports do not expose backing membership Sets', () => {
  assert.equal('NUTRITION_MEAL_TYPE_SET' in medicalDomain, false);
});

test('public root exports expose the Nutrition domain contract', () => {
  assert.equal(NUTRITION_KIND, 'nutrition');
  assert.equal(NUTRITION_SCHEMA_VERSION, 2);
  assert.equal(NUTRITION_LEGACY_SCHEMA_VERSION, 1);
  assert.equal(NUTRITION_CANONICAL_MAX_CARBOHYDRATES_GRAMS, 1000);
  assert.equal(NUTRITION_MEAL_TYPES.length, 6);
  assert.equal(isNutritionMealType('unspecified'), true);
  assert.equal(isNutritionMealType('Breakfast'), false);
  assert.deepEqual(validateNutritionCanonicalCarbohydratesGrams(12.125), {
    ok: true,
    carbohydratesGrams: 12.125,
  });
  assert.equal(
    validateNutritionItemSnapshot({
      itemId: 'item-1',
      name: 'Bread',
      carbohydratesGrams: 10,
    }).ok,
    true,
  );
  assert.equal(
    validateNutritionTimelineEventV2({
      kind: 'nutrition',
      mealType: 'dinner',
      carbohydratesGrams: 40,
      schemaVersion: 2,
    }).ok,
    true,
  );
  assert.equal(
    classifyNutritionTimelineEvent({
      kind: 'nutrition',
      schemaVersion: 1,
      mode: 'manual',
      mealType: 'Завтрак',
      carbohydratesGrams: 20,
    }).status,
    'legacy_v1',
  );
});

test('Nutrition domain exports do not include recommendation or food-catalogue APIs', () => {
  assert.equal('calculateNutritionInsulinDose' in medicalDomain, false);
  assert.equal('recommendNutritionCarbs' in medicalDomain, false);
  assert.equal('lookupNutritionProductByName' in medicalDomain, false);
  assert.equal('NUTRITION_FOOD_CATALOGUE' in medicalDomain, false);
});
