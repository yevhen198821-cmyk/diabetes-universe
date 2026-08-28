import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseTargetEditorNumericInput,
  validateTargetEditorInput,
} from './diabetes-settings-target-validation.ts';

test('validateTargetEditorInput rejects empty values', () => {
  assert.deepEqual(validateTargetEditorInput('', '10', 'mmol_per_l'), {
    ok: false,
    issue: 'empty',
  });
});

test('validateTargetEditorInput rejects equal bounds', () => {
  assert.deepEqual(validateTargetEditorInput('5', '5', 'mmol_per_l'), {
    ok: false,
    issue: 'low_equal_high',
  });
});

test('validateTargetEditorInput rejects low greater than high', () => {
  assert.deepEqual(validateTargetEditorInput('10', '4', 'mmol_per_l'), {
    ok: false,
    issue: 'low_greater_than_high',
  });
});

test('validateTargetEditorInput accepts valid mmol/L values', () => {
  const result = validateTargetEditorInput('4.0', '10.0', 'mmol_per_l');
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.lowMmolPerL, 4);
    assert.equal(result.highMmolPerL, 10);
  }
});

test('parseTargetEditorNumericInput converts mg/dL integers to mmol/L', () => {
  const converted = parseTargetEditorNumericInput('180', 'mg_per_dl');
  assert.ok(converted !== null);
  assert.ok(converted > 9.9 && converted < 10.1);
});

test('parseTargetEditorNumericInput rejects fractional mg/dL values', () => {
  assert.equal(parseTargetEditorNumericInput('72.5', 'mg_per_dl'), null);
});

test('validateTargetEditorInput rejects out-of-bounds mmol/L values', () => {
  assert.deepEqual(validateTargetEditorInput('0.01', '10', 'mmol_per_l'), {
    ok: false,
    issue: 'out_of_bounds',
  });
});
