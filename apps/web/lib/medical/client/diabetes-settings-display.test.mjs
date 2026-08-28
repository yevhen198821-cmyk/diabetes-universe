import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatGlucoseValueForDisplay,
  formatTargetRangeForDisplay,
  toTargetEditorDisplayValue,
} from './diabetes-settings-display.ts';

test('formatTargetRangeForDisplay uses mmol/L when display unit is null', () => {
  assert.equal(formatTargetRangeForDisplay(4, 10, null), '4.0–10.0 mmol/L');
});

test('formatTargetRangeForDisplay converts to mg/dL for display unit preference', () => {
  const formatted = formatTargetRangeForDisplay(4, 10, 'mg_per_dl');
  assert.match(formatted, /^72–180 mg\/dL$/);
});

test('toTargetEditorDisplayValue rounds mg/dL to whole numbers', () => {
  assert.equal(toTargetEditorDisplayValue(5.5, 'mg_per_dl'), '99');
});

test('formatGlucoseValueForDisplay keeps one decimal for mmol/L', () => {
  assert.equal(formatGlucoseValueForDisplay(4, 'mmol_per_l'), '4.0');
});
