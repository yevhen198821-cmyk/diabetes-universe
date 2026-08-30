import assert from 'node:assert/strict';
import test from 'node:test';

import { INSULIN_PREPARATION_IDS } from '@diabetes-universe/medical-domain';

import { resolveInsulinPresentationLabels } from '../medical/insulin/insulin-presentation-labels.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import {
  prepareInsulinQuickAddSubmit,
  resolveInsulinQuickAddPreparationSnapshot,
} from './insulin-quick-add-submit.ts';

const russianRequest = {
  acceptLanguage: 'ru-RU',
  cookieTimeZone: 'Europe/Moscow',
};

let labels;
let russianLabels;

test.before(async () => {
  labels = resolveInsulinPresentationLabels(
    (await createTestPlatformRuntime()).localization,
  );
  russianLabels = resolveInsulinPresentationLabels(
    (await createTestPlatformRuntime({ request: russianRequest })).localization,
  );
});

function submit(overrides = {}, presentationLabels = labels) {
  return prepareInsulinQuickAddSubmit({
    formState: {
      administrationContext: null,
      dose: '4',
      otherName: '',
      preparationId: 'insulin.prep.aspart_novorapid',
      time: '08:05',
      ...overrides,
    },
    labels: presentationLabels,
  });
}

test('a catalogue selection submits the identity with its localized snapshot', () => {
  const result = submit({ administrationContext: 'before_meal' });

  assert.equal(result.type, 'prepared');
  assert.deepEqual(result.entry, {
    administrationContext: 'before_meal',
    doseUnits: 4,
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.aspart_novorapid',
    time: '08:05',
  });
});

test('every catalogue identity resolves its own snapshot and never another entry label', () => {
  for (const preparationId of INSULIN_PREPARATION_IDS) {
    const result = submit({
      otherName: 'Pharmacy own-brand insulin',
      preparationId,
    });

    assert.equal(result.type, 'prepared');
    assert.equal(result.entry.preparationId, preparationId);

    const expected =
      preparationId === 'insulin.prep.other'
        ? 'Pharmacy own-brand insulin'
        : labels.preparations[preparationId];

    assert.equal(result.entry.preparation, expected);

    for (const other of INSULIN_PREPARATION_IDS) {
      if (other === preparationId || other === 'insulin.prep.other') {
        continue;
      }

      assert.notEqual(result.entry.preparation, labels.preparations[other]);
    }
  }
});

test('identity is never derived from the snapshot string', () => {
  for (const snapshot of ['NovoRapid', 'Lantus', 'Другое', 'Other']) {
    const result = submit({
      otherName: snapshot,
      preparationId: 'insulin.prep.other',
    });

    assert.equal(result.entry.preparationId, 'insulin.prep.other');
    assert.equal(result.entry.preparation, snapshot);
  }

  assert.equal(
    resolveInsulinQuickAddPreparationSnapshot({
      labels,
      otherName: 'Lantus',
      preparationId: 'insulin.prep.aspart_novorapid',
    }),
    'NovoRapid',
  );
});

test('a missing preparation selection cannot submit', () => {
  const result = submit({ preparationId: null });

  assert.equal(result.type, 'invalid');
  assert.equal(result.field, 'preparation');
});

test('Other without a name is rejected instead of repaired', () => {
  for (const otherName of ['', '   ', '\t']) {
    const result = submit({ otherName, preparationId: 'insulin.prep.other' });

    assert.equal(result.type, 'invalid');
    assert.equal(result.field, 'otherName');
  }
});

test('Other stores the trimmed user-entered name', () => {
  const result = submit({
    otherName: '  Pharmacy own-brand insulin  ',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(result.type, 'prepared');
  assert.equal(result.entry.preparation, 'Pharmacy own-brand insulin');
  assert.equal(result.entry.preparationId, 'insulin.prep.other');
});

test('the localized Other label is never stored as the snapshot', () => {
  const result = submit(
    {
      otherName: 'Аптечный инсулин',
      preparationId: 'insulin.prep.other',
    },
    russianLabels,
  );

  assert.equal(result.entry.preparation, 'Аптечный инсулин');
  assert.notEqual(
    result.entry.preparation,
    russianLabels.preparations['insulin.prep.other'],
  );
  assert.notEqual(result.entry.preparation, 'Другое');
  assert.notEqual(result.entry.preparation, 'Other');
});

test('switching from Other to a catalogue entry never submits the Other name', () => {
  const result = submit({
    otherName: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.glargine_lantus',
  });

  assert.equal(result.entry.preparationId, 'insulin.prep.glargine_lantus');
  assert.equal(result.entry.preparation, 'Lantus');
});

test('the snapshot is resolved through the active locale catalogue labels', () => {
  const russian = submit(
    { preparationId: 'insulin.prep.aspart_novorapid' },
    russianLabels,
  );

  assert.equal(russian.entry.preparation, 'NovoRapid');
  assert.equal(russian.entry.preparationId, 'insulin.prep.aspart_novorapid');
});

test('grouping chrome is never part of the submitted entry', () => {
  const result = submit({ preparationId: 'insulin.prep.glargine_lantus' });

  assert.equal(Object.hasOwn(result.entry, 'grouping'), false);
  assert.equal(Object.hasOwn(result.entry, 'preparationCategory'), false);
  assert.deepEqual(Object.keys(result.entry).sort(), [
    'administrationContext',
    'doseUnits',
    'preparation',
    'preparationId',
    'time',
  ]);
});

test('a semantic administration context is submitted as its ID', () => {
  for (const context of [
    'before_meal',
    'after_meal',
    'correction',
    'basal',
    'other',
    'unspecified',
  ]) {
    const result = submit({ administrationContext: context });

    assert.equal(result.entry.administrationContext, context);
  }
});

test('a localized context label is never submitted', () => {
  const result = submit(
    { administrationContext: 'correction' },
    russianLabels,
  );

  assert.equal(result.entry.administrationContext, 'correction');
  assert.notEqual(result.entry.administrationContext, 'Коррекция');
});

test('no context choice normalizes to the semantic unspecified value', () => {
  const result = submit({ administrationContext: null });

  assert.equal(result.entry.administrationContext, 'unspecified');
});

test('explicitly choosing Not specified writes the same semantic value', () => {
  const explicit = submit({ administrationContext: 'unspecified' });
  const implicit = submit({ administrationContext: null });

  assert.equal(explicit.entry.administrationContext, 'unspecified');
  assert.equal(
    explicit.entry.administrationContext,
    implicit.entry.administrationContext,
  );
});

test('the legacy free-text context is never present on the entry', () => {
  const result = submit({ administrationContext: 'before_meal' });

  assert.equal(Object.hasOwn(result.entry, 'context'), false);
  assert.equal(
    JSON.stringify(result.entry).includes('Перед едой'),
    false,
  );
});

test('an invalid manual dose is rejected before the domain write', () => {
  for (const dose of ['', '0', '-1', '101', '4.125', 'abc']) {
    const result = submit({ dose });

    assert.equal(result.type, 'invalid');
    assert.equal(result.field, 'dose');
  }
});

test('a two-decimal dose reaches the entry without rounding', () => {
  const result = submit({ dose: '12,25' });

  assert.equal(result.entry.doseUnits, 12.25);
});

test('a blank time cannot submit', () => {
  const result = submit({ time: '' });

  assert.equal(result.type, 'invalid');
  assert.equal(result.field, 'time');
});
