import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  getGlucoseQuickAddBoundsForDisplayUnit,
  parseGlucoseInput,
} from './format-glucose.ts';

const glucoseFormSource = readFileSync(
  fileURLToPath(
    new URL(
      '../../components/quick-add/glucose-quick-add-form.tsx',
      import.meta.url,
    ),
  ),
  'utf8',
);

test('parseGlucoseInput converts mg/dL integers to canonical mmol/L', () => {
  const mmol = parseGlucoseInput('180', 'mg_per_dl');
  assert.ok(mmol !== null);
  assert.ok(Math.abs(mmol - 9.99) < 0.01);
});

test('parseGlucoseInput rejects ambiguous mg/dL fractions', () => {
  assert.equal(parseGlucoseInput('72.5', 'mg_per_dl'), null);
});

test('parseGlucoseInput rejects values outside mmol/L bounds', () => {
  assert.equal(parseGlucoseInput('41', 'mmol_per_l'), null);
});

test('parseGlucoseInput rejects values outside converted mg/dL bounds', () => {
  const bounds = getGlucoseQuickAddBoundsForDisplayUnit('mg_per_dl');
  assert.equal(parseGlucoseInput(String(bounds.max + 1), 'mg_per_dl'), null);
});

test('glucose quick add blocks value entry until settings are ready and configured', () => {
  assert.match(glucoseFormSource, /loadState === 'loading'/);
  assert.match(glucoseFormSource, /isUnconfigured/);
  assert.match(glucoseFormSource, /disabled=\{!canEnterValue\}/);
  assert.match(
    glucoseFormSource,
    /if \(!canEnterValue \|\| !glucoseDisplayUnit\)/,
  );
});

test('glucose quick add does not patch display unit inside the form', () => {
  assert.doesNotMatch(glucoseFormSource, /patchGlucoseDisplayUnit/);
  assert.doesNotMatch(glucoseFormSource, /pendingDisplayUnit/);
});

test('glucose quick add defaults context to undefined', () => {
  assert.match(glucoseFormSource, /context: undefined/);
  assert.doesNotMatch(glucoseFormSource, /glucoseContextOptions\[0\]/);
});

test('glucose quick add passes semantic context through on submit', () => {
  assert.match(glucoseFormSource, /context: formState\.context/);
});

test('glucose quick add uses shared medical-domain precision for mg/dL bounds', () => {
  const bounds = getGlucoseQuickAddBoundsForDisplayUnit('mg_per_dl');
  assert.equal(bounds.min, 2);
  assert.equal(bounds.max, 721);
});

test('glucose quick add does not duplicate conversion implementation', () => {
  const source = readFileSync(
    fileURLToPath(new URL('./format-glucose.ts', import.meta.url)),
    'utf8',
  );

  assert.match(source, /toGlucoseDisplayNumericValue/);
  assert.match(source, /convertGlucoseMgPerDlToMmolPerL/);
  assert.doesNotMatch(source, /18\.0182/);
});
