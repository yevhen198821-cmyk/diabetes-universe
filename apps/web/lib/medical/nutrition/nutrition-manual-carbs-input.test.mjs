import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NUTRITION_MANUAL_CARBS_UI_MAXIMUM,
  parseNutritionManualCarbsInput,
  parseNutritionManualDecimalInput,
} from './nutrition-manual-carbs-input.ts';

const VALID = ['12', '12.1', '12.12', '12,1', '12,12', '0.1', '0,1', '500'];

test('manual carbs parser accepts the approved presentation values', () => {
  assert.equal(parseNutritionManualCarbsInput('12'), 12);
  assert.equal(parseNutritionManualCarbsInput('12.1'), 12.1);
  assert.equal(parseNutritionManualCarbsInput('12.12'), 12.12);
  assert.equal(parseNutritionManualCarbsInput('12,1'), 12.1);
  assert.equal(parseNutritionManualCarbsInput('12,12'), 12.12);
  assert.equal(parseNutritionManualCarbsInput('0.1'), 0.1);
  assert.equal(parseNutritionManualCarbsInput('0,1'), 0.1);
  assert.equal(
    parseNutritionManualCarbsInput(String(NUTRITION_MANUAL_CARBS_UI_MAXIMUM)),
    NUTRITION_MANUAL_CARBS_UI_MAXIMUM,
  );
});

test('manual carbs parser keeps two-decimal values without rounding', () => {
  const value = parseNutritionManualCarbsInput('12.12');

  assert.equal(value, 12.12);
  assert.equal(Object.is(value, 12.12), true);
});

test('manual carbs parser rejects empty, zero, negative, and non-numeric input', () => {
  assert.equal(parseNutritionManualCarbsInput(''), null);
  assert.equal(parseNutritionManualCarbsInput('   '), null);
  assert.equal(parseNutritionManualCarbsInput('0'), null);
  assert.equal(parseNutritionManualCarbsInput('-1'), null);
  assert.equal(parseNutritionManualCarbsInput('abc'), null);
  assert.equal(parseNutritionManualCarbsInput('NaN'), null);
  assert.equal(parseNutritionManualCarbsInput('Infinity'), null);
  assert.equal(parseNutritionManualCarbsInput('+inf'), null);
});

test('manual carbs parser rejects values above the presentation ceiling', () => {
  assert.equal(parseNutritionManualCarbsInput('500.01'), null);
  assert.equal(parseNutritionManualCarbsInput('500,01'), null);
  assert.equal(parseNutritionManualCarbsInput('501'), null);
});

test('manual carbs parser rejects more than two fraction digits', () => {
  assert.equal(parseNutritionManualCarbsInput('12.125'), null);
  assert.equal(parseNutritionManualCarbsInput('12,125'), null);
});

test('manual carbs parser rejects multiple separators and malformed whitespace', () => {
  assert.equal(parseNutritionManualCarbsInput('1,2,3'), null);
  assert.equal(parseNutritionManualCarbsInput('1.2.3'), null);
  assert.equal(parseNutritionManualCarbsInput('12. 12'), null);
  assert.equal(parseNutritionManualCarbsInput('12 .12'), null);
  assert.equal(parseNutritionManualCarbsInput('12,'), null);
  assert.equal(parseNutritionManualCarbsInput('.12'), null);
});

test('weight parser reuses the same syntax with a separate maximum', () => {
  assert.equal(parseNutritionManualDecimalInput('100', 3000), 100);
  assert.equal(parseNutritionManualDecimalInput('3000', 3000), 3000);
  assert.equal(parseNutritionManualDecimalInput('3000.01', 3000), null);
  assert.equal(parseNutritionManualDecimalInput('12.125', 3000), null);
});

test('every documented valid example is accepted', () => {
  for (const raw of VALID) {
    assert.notEqual(parseNutritionManualCarbsInput(raw), null, raw);
  }
});
