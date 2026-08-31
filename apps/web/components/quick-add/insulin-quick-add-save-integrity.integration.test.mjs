import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

const formSource = readFileSync(
  join(
    dirname(new URL(import.meta.url).pathname),
    'insulin-quick-add-form.tsx',
  ),
  'utf8',
);

test('InsulinQuickAddForm wires submit pending changes to host callback', () => {
  assert.match(formSource, /onSubmittingChange\?\.\(pending\)/);
});

test('InsulinQuickAddForm delegates submit identity to controller model', () => {
  assert.match(formSource, /prepareInsulinQuickAddSubmitWithIdentity/);
  assert.match(formSource, /persistPreparedInsulinQuickAddSubmit/);
  assert.match(formSource, /createInsulinQuickAddSubmitIdentityState/);
});

test('InsulinQuickAddForm validates before entering submit pending state', () => {
  assert.match(
    formSource,
    /const prepared = prepareInsulinQuickAddSubmitWithIdentity\(/,
  );
  assert.match(formSource, /if \(prepared\.type === 'invalid'\)/);
  assert.match(
    formSource,
    /if \(prepared\.type === 'invalid'\)[\s\S]*return;[\s\S]*isSubmittingRef\.current = true;/,
  );
});

test('InsulinQuickAddForm locks mutable controls while submitting', () => {
  assert.match(formSource, /const controlsDisabled = isSubmitting/);
  assert.match(formSource, /disabled=\{controlsDisabled\}/);
});

test('InsulinQuickAddForm surfaces localized save error without closing', () => {
  assert.match(formSource, /setSaveError\(labels\.saveErrorDescription\)/);
  assert.match(formSource, /labels\.saveErrorTitle/);
});
