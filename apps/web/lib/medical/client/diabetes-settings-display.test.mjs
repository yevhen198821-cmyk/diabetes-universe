import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatGlucoseValueForDisplay,
  formatGlucoseValueForLocalizedDisplay,
  formatTargetRangeForDisplay,
} from './diabetes-settings-display.ts';
import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';

test('formatGlucoseValueForDisplay converts canonical mmol/L to mg/dL', () => {
  assert.equal(formatGlucoseValueForDisplay(5.5, 'mg_per_dl'), '99');
});

test('formatGlucoseValueForDisplay keeps one decimal for mmol/L', () => {
  assert.equal(formatGlucoseValueForDisplay(4, 'mmol_per_l'), '4.0');
  assert.equal(formatGlucoseValueForDisplay(6.84, 'mmol_per_l'), '6.8');
});

test('formatGlucoseValueForLocalizedDisplay uses locale decimal separators', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });

  assert.equal(
    formatGlucoseValueForLocalizedDisplay(runtime.formatter, 7.3, 'mmol_per_l'),
    '7,3',
  );
});

test('formatTargetRangeForDisplay does not rewrite canonical values when unit changes', () => {
  const mmol = formatTargetRangeForDisplay(4, 10, 'mmol_per_l');
  const mg = formatTargetRangeForDisplay(4, 10, 'mg_per_dl');

  assert.equal(mmol, '4.0–10.0 mmol/L');
  assert.equal(mg, '72–180 mg/dL');
});

test('formatTargetRangeForDisplay uses mmol/L presentation when display unit is null', () => {
  assert.equal(formatTargetRangeForDisplay(4, 10, null), '4.0–10.0 mmol/L');
});

test('toTargetEditorDisplayValue rounds mg/dL to whole numbers', async () => {
  const { toTargetEditorDisplayValue } =
    await import('./diabetes-settings-display.ts');
  assert.equal(toTargetEditorDisplayValue(5.5, 'mg_per_dl'), '99');
});
