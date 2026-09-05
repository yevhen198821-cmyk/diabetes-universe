import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NUTRITION_MEAL_TYPES,
  isNutritionMealType,
} from './nutrition-meal-type.ts';

const CANONICAL_MEAL_TYPES = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'other',
  'unspecified',
];

test('every canonical meal type is accepted', () => {
  assert.deepEqual([...NUTRITION_MEAL_TYPES], CANONICAL_MEAL_TYPES);

  for (const mealType of NUTRITION_MEAL_TYPES) {
    assert.equal(isNutritionMealType(mealType), true);
  }
});

test('localized and arbitrary meal-type strings are rejected without inference', () => {
  assert.equal(isNutritionMealType('Breakfast'), false);
  assert.equal(isNutritionMealType('Завтрак'), false);
  assert.equal(isNutritionMealType('Frühstück'), false);
  assert.equal(isNutritionMealType('arbitrary'), false);
  assert.equal(isNutritionMealType('breakfast '), false);
  assert.equal(isNutritionMealType(''), false);
  assert.equal(isNutritionMealType(null), false);
  assert.equal(isNutritionMealType(undefined), false);
});

test('exported meal types are frozen and mutation cannot change guards', () => {
  const snapshot = [...NUTRITION_MEAL_TYPES];

  assert.equal(Object.isFrozen(NUTRITION_MEAL_TYPES), true);
  assert.throws(() => {
    NUTRITION_MEAL_TYPES.push('brunch');
  }, TypeError);
  assert.throws(() => {
    NUTRITION_MEAL_TYPES[0] = 'brunch';
  }, TypeError);
  assert.deepEqual([...NUTRITION_MEAL_TYPES], snapshot);
  assert.equal(isNutritionMealType('brunch'), false);
  assert.equal(isNutritionMealType(snapshot[0]), true);
});
