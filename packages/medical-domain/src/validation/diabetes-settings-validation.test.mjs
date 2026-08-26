import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DIABETES_TYPE_CATEGORIES,
  GLUCOSE_DISPLAY_UNITS,
  TARGET_RANGE_SOURCES,
} from '../types/diabetes-settings-enums.ts';
import {
  DiabetesSettingsValidationError,
  assertGlucoseDisplayUnit,
  isDiabetesTypeCategory,
  isGlucoseDisplayUnit,
  isTargetRangeSource,
  validateDiabetesTypeClassification,
  validateGlucoseTargetRange,
} from './diabetes-settings-validation.ts';
import { DIABETES_SETTINGS_VALIDATION_BOUNDS } from './diabetes-settings-bounds.ts';

test('glucose display unit taxonomy', () => {
  assert.deepEqual([...GLUCOSE_DISPLAY_UNITS], ['mmol_per_l', 'mg_per_dl']);
  assert.equal(isGlucoseDisplayUnit('mmol_per_l'), true);
  assert.equal(isGlucoseDisplayUnit('mg_per_dl'), true);
  assert.equal(isGlucoseDisplayUnit('mmol/L'), false);
  assert.throws(
    () => assertGlucoseDisplayUnit('mg/dL'),
    DiabetesSettingsValidationError,
  );
});

test('diabetes type taxonomy', () => {
  assert.deepEqual(DIABETES_TYPE_CATEGORIES.includes('unknown'), true);
  assert.equal(isDiabetesTypeCategory('type_1'), true);
  assert.equal(isDiabetesTypeCategory('missing'), false);
  assert.deepEqual(
    validateDiabetesTypeClassification({
      category: 'unknown',
      source: 'self_reported',
    }),
    {
      category: 'unknown',
      otherDescriptor: null,
      source: 'self_reported',
    },
  );
});

test('target provenance taxonomy', () => {
  assert.deepEqual(
    [...TARGET_RANGE_SOURCES],
    ['user_defined', 'clinician_defined', 'imported', 'system_reference'],
  );
  assert.equal(isTargetRangeSource('system_reference'), true);
  assert.equal(isTargetRangeSource('guideline'), false);
});

test('valid target range passes validation', () => {
  assert.deepEqual(
    validateGlucoseTargetRange({
      lowMmolPerL: 4,
      highMmolPerL: 10,
      source: 'user_defined',
    }),
    {
      lowMmolPerL: 4,
      highMmolPerL: 10,
      source: 'user_defined',
    },
  );
});

test('low equal high is rejected', () => {
  assert.throws(
    () =>
      validateGlucoseTargetRange({
        lowMmolPerL: 5,
        highMmolPerL: 5,
        source: 'user_defined',
      }),
    /less than highMmolPerL/,
  );
});

test('low greater than high is rejected', () => {
  assert.throws(
    () =>
      validateGlucoseTargetRange({
        lowMmolPerL: 8,
        highMmolPerL: 4,
        source: 'user_defined',
      }),
    /less than highMmolPerL/,
  );
});

test('below medical bound is rejected', () => {
  assert.throws(
    () =>
      validateGlucoseTargetRange({
        lowMmolPerL: 0.05,
        highMmolPerL: 5,
        source: 'user_defined',
      }),
    /outside supported medical bounds/,
  );
});

test('above medical bound is rejected', () => {
  assert.throws(
    () =>
      validateGlucoseTargetRange({
        lowMmolPerL: 4,
        highMmolPerL: 101,
        source: 'user_defined',
      }),
    /outside supported medical bounds/,
  );
});

test('NaN and Infinity are rejected', () => {
  for (const lowMmolPerL of [
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ]) {
    assert.throws(
      () =>
        validateGlucoseTargetRange({
          lowMmolPerL,
          highMmolPerL: 8,
          source: 'user_defined',
        }),
      /finite number/,
    );
  }
});

test('validation bounds align with canonical medical glucose limits', () => {
  assert.equal(DIABETES_SETTINGS_VALIDATION_BOUNDS.GLUCOSE_MMOL_MIN, 0.1);
  assert.equal(DIABETES_SETTINGS_VALIDATION_BOUNDS.GLUCOSE_MMOL_MAX, 100);
});
