import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

const formSource = readFileSync(
  join(
    dirname(new URL(import.meta.url).pathname),
    'nutrition-quick-add-form.tsx',
  ),
  'utf8',
);

test('NutritionQuickAddForm wires submit pending changes to host callback', () => {
  assert.match(formSource, /onSubmittingChange\?\.\(pending\)/);
});

test('NutritionQuickAddForm delegates submit identity to controller model', () => {
  assert.match(formSource, /prepareNutritionQuickAddSubmitWithIdentity/);
  assert.match(formSource, /persistPreparedNutritionQuickAddSubmit/);
  assert.match(formSource, /createNutritionQuickAddSubmitIdentityState/);
});

test('NutritionQuickAddForm validates before entering submit pending state', () => {
  assert.match(formSource, /prepareNutritionQuickAddSubmitWithIdentity\(/);
  assert.match(formSource, /if \(prepared\.type === 'invalid'\)/);
  assert.match(
    formSource,
    /if \(prepared\.type === 'invalid'\)[\s\S]*return;[\s\S]*isSubmittingRef\.current = true;/,
  );
});

test('NutritionQuickAddForm locks mutable controls while submitting', () => {
  assert.match(formSource, /const controlsDisabled = isSubmitting/);
  assert.match(formSource, /disabled=\{controlsDisabled\}/);
});

test('NutritionQuickAddForm surfaces localized save error without closing', () => {
  assert.match(formSource, /setSaveError\(labels\.saveErrorDescription\)/);
  assert.match(formSource, /labels\.saveErrorTitle/);
});

test('NutritionQuickAddForm clears save error when the user edits a failed attempt', () => {
  assert.match(formSource, /const noteFailedAttemptFieldEdit = \(\) => \{/);
  assert.match(formSource, /noteFailedAttemptFieldEdit\(\)/);
});
