import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

const formSource = readFileSync(
  join(
    dirname(new URL(import.meta.url).pathname),
    'glucose-quick-add-form.tsx',
  ),
  'utf8',
);

test('GlucoseQuickAddForm production contract does not expose draftState', () => {
  assert.doesNotMatch(formSource, /\bdraftState\b/);
});

test('GlucoseQuickAddForm wires submit pending changes to host callback', () => {
  assert.match(formSource, /onSubmittingChange\?\.\(pending\)/);
});

test('GlucoseQuickAddForm delegates submit identity to controller model', () => {
  assert.match(formSource, /executeGlucoseQuickAddSubmit/);
  assert.match(formSource, /createGlucoseQuickAddSubmitIdentityState/);
});

test('GlucoseQuickAddForm locks mutable controls while submitting', () => {
  assert.match(formSource, /const controlsDisabled = isSubmitting/);
  assert.match(formSource, /disabled=\{controlsDisabled\}/);
  assert.match(formSource, /disabled=\{!canEnterValue \|\| controlsDisabled\}/);
});

test('save error copy uses neutral persistence messaging in locales', () => {
  const enMessages = readFileSync(
    join(
      dirname(new URL(import.meta.url).pathname),
      '../../../../packages/locales/src/resources/en/messages.ts',
    ),
    'utf8',
  );

  const saveErrorMatch = enMessages.match(
    /'quick-add\.glucose\.saveError\.description':\s*\n?\s*'([^']+)'/,
  );

  assert.notEqual(saveErrorMatch, null);
  assert.match(saveErrorMatch[1] ?? '', /not saved/i);
  assert.match(saveErrorMatch[1] ?? '', /still in the form/i);
  assert.doesNotMatch(saveErrorMatch[1] ?? '', /connection/i);
});
