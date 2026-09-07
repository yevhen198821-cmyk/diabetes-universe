import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import test from 'node:test';

const directory = dirname(new URL(import.meta.url).pathname);

function readForm(fileName) {
  return readFileSync(join(directory, fileName), 'utf8');
}

const medicationSource = readForm('medication-quick-add-form.tsx');
const activitySource = readForm('activity-quick-add-form.tsx');
const noteSource = readForm('note-quick-add-form.tsx');

for (const [kind, formSource] of [
  ['Medication', medicationSource],
  ['Activity', activitySource],
  ['Note', noteSource],
]) {
  test(`${kind}QuickAddForm wires submit pending changes to host callback`, () => {
    assert.match(formSource, /onSubmittingChange\?\.\(pending\)/);
  });

  test(`${kind}QuickAddForm validates before entering submit pending state`, () => {
    assert.match(formSource, /if \(prepared\.type === 'invalid'\)/);
    assert.match(
      formSource,
      /if \(prepared\.type === 'invalid'\)[\s\S]*return;[\s\S]*isSubmittingRef\.current = true;/,
    );
  });

  test(`${kind}QuickAddForm prevents a second write from double submit`, () => {
    assert.match(
      formSource,
      /if \(isSubmittingRef\.current\) \{\s*return;\s*\}/,
    );
    assert.match(formSource, /isSubmittingRef\.current = true;/);
  });

  test(`${kind}QuickAddForm blocks cancel while submit is pending`, () => {
    assert.match(
      formSource,
      /const handleCancel = \(\) => \{\s*if \(isSubmittingRef\.current\) \{\s*return;\s*\}/,
    );
  });

  test(`${kind}QuickAddForm locks mutable controls while submitting`, () => {
    assert.match(formSource, /const controlsDisabled = isSubmitting/);
    assert.match(formSource, /disabled=\{controlsDisabled\}/);
  });

  test(`${kind}QuickAddForm surfaces localized save error without closing`, () => {
    assert.match(
      formSource,
      /setSaveError\(saveLabels\.saveErrorDescription\)/,
    );
    assert.match(formSource, /saveLabels\.saveErrorTitle/);
    assert.match(formSource, /role="alert"/);
    assert.match(formSource, /role="status"/);
    assert.doesNotMatch(formSource, /haptics\.success\(\)/);
    assert.doesNotMatch(formSource, /closeQuickAdd\(/);
  });

  test(`${kind}QuickAddForm clears save error when the user edits a failed attempt`, () => {
    assert.match(formSource, /const noteFailedAttemptFieldEdit = \(\) => \{/);
    assert.match(formSource, /noteFailedAttemptFieldEdit\(\)/);
  });
}

test('MedicationQuickAddForm delegates submit identity to controller model', () => {
  assert.match(medicationSource, /prepareMedicationQuickAddSubmitWithIdentity/);
  assert.match(medicationSource, /persistPreparedMedicationQuickAddSubmit/);
  assert.match(medicationSource, /createMedicationQuickAddSubmitIdentityState/);
});

test('ActivityQuickAddForm delegates submit identity to controller model', () => {
  assert.match(activitySource, /prepareActivityQuickAddSubmitWithIdentity/);
  assert.match(activitySource, /persistPreparedActivityQuickAddSubmit/);
  assert.match(activitySource, /createActivityQuickAddSubmitIdentityState/);
});

test('NoteQuickAddForm delegates submit identity to controller model', () => {
  assert.match(noteSource, /prepareNoteQuickAddSubmitWithIdentity/);
  assert.match(noteSource, /persistPreparedNoteQuickAddSubmit/);
  assert.match(noteSource, /createNoteQuickAddSubmitIdentityState/);
});
