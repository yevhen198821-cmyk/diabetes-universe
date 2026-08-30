import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { resolveInsulinPresentationLabels } from './insulin-presentation-labels.ts';
import {
  createInsulinEditSelection,
  INSULIN_EDIT_UI_DOSE_MAXIMUM,
  resolveInsulinEditLegacyContextText,
  resolveInsulinEditTransition,
} from './resolve-insulin-edit-transition.ts';

const semanticEvent = {
  administrationContext: 'before_meal',
  doseUnits: 4,
  preparation: 'NovoRapid',
  preparationId: 'insulin.prep.aspart_novorapid',
};

const legacyEvent = {
  context: 'Перед завтраком',
  doseUnits: 4,
  preparation: 'NovoRapid',
};

let labels;

test.before(async () => {
  const runtime = await createTestPlatformRuntime();
  labels = resolveInsulinPresentationLabels(runtime.localization);
});

function transition(event, selectionOverrides = {}) {
  return resolveInsulinEditTransition({
    event,
    labels,
    selection: { ...createInsulinEditSelection(event), ...selectionOverrides },
  });
}

test('semantic preparation A to B updates identity and snapshot atomically', () => {
  const result = transition(semanticEvent, {
    preparationId: 'insulin.prep.aspart_fiasp',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.transition.preparation, {
    preparation: 'Fiasp',
    preparationId: 'insulin.prep.aspart_fiasp',
  });
});

test('leaving a semantic preparation unchanged preserves identity and snapshot exactly', () => {
  const localizedSnapshotEvent = {
    ...semanticEvent,
    preparation: 'НовоРапид',
  };
  const result = transition(localizedSnapshotEvent);

  assert.equal(result.ok, true);
  assert.deepEqual(result.transition.preparation, {
    preparation: 'НовоРапид',
    preparationId: 'insulin.prep.aspart_novorapid',
  });
});

test('selecting Other requires and stores a user-entered name', () => {
  const result = transition(semanticEvent, {
    otherName: '  Pharmacy own-brand insulin  ',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.transition.preparation, {
    preparation: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });
});

test('the Other snapshot is never the localized Other chrome label', () => {
  const result = transition(semanticEvent, {
    otherName: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });

  assert.notEqual(
    result.transition.preparation.preparation,
    labels.preparations['insulin.prep.other'],
  );
  assert.notEqual(result.transition.preparation.preparation, 'Другое');
});

test('a blank Other name is rejected instead of repaired', () => {
  for (const otherName of ['', '   ', '\t']) {
    const result = transition(semanticEvent, {
      otherName,
      preparationId: 'insulin.prep.other',
    });

    assert.equal(result.ok, false);
    assert.equal(
      result.errors.otherName,
      'insulin.preparation.other_name_required',
    );
  }
});

test('an existing Other event keeps its snapshot when the name is untouched', () => {
  const otherEvent = {
    administrationContext: 'correction',
    doseUnits: 3,
    preparation: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  };
  const selection = createInsulinEditSelection(otherEvent);

  assert.equal(selection.otherName, 'Pharmacy own-brand insulin');

  const result = transition(otherEvent);

  assert.deepEqual(result.transition.preparation, {
    preparation: 'Pharmacy own-brand insulin',
    preparationId: 'insulin.prep.other',
  });
});

test('legacy dose-only edit preserves the snapshot and the absence of an id', () => {
  const result = transition(legacyEvent, { dose: '6' });

  assert.equal(result.ok, true);
  assert.equal(result.transition.doseUnits, 6);
  assert.deepEqual(result.transition.preparation, {
    preparation: 'NovoRapid',
    preparationId: null,
  });
});

test('no catalogue identity is inferred from a legacy display string', () => {
  for (const preparation of [
    'NovoRapid',
    'Fiasp',
    'Humalog',
    'Apidra',
    'Lantus',
    'Tresiba',
    'novorapid',
    'Другое',
  ]) {
    const selection = createInsulinEditSelection({
      context: 'Перед завтраком',
      doseUnits: 4,
      preparation,
    });

    assert.equal(selection.preparationId, null);

    const result = resolveInsulinEditTransition({
      event: { context: 'Перед завтраком', doseUnits: 4, preparation },
      labels,
      selection,
    });

    assert.equal(result.transition.preparation.preparationId, null);
    assert.equal(result.transition.preparation.preparation, preparation);
  }
});

test('an id is attached to a legacy event only after an explicit catalogue selection', () => {
  const result = transition(legacyEvent, {
    preparationId: 'insulin.prep.glargine_lantus',
  });

  assert.deepEqual(result.transition.preparation, {
    preparation: 'Lantus',
    preparationId: 'insulin.prep.glargine_lantus',
  });
});

test('an explicit semantic context change writes the semantic value only', () => {
  const result = transition(legacyEvent, {
    administrationContext: 'correction',
    contextEdited: true,
  });

  assert.deepEqual(result.transition.context, {
    administrationContext: 'correction',
    kind: 'semantic',
  });
});

test('unspecified is a real semantic value for an explicit context edit', () => {
  const result = transition(semanticEvent, {
    administrationContext: 'unspecified',
    contextEdited: true,
  });

  assert.deepEqual(result.transition.context, {
    administrationContext: 'unspecified',
    kind: 'semantic',
  });
});

test('a dose-only edit preserves existing semantic preparation and context', () => {
  const result = transition(semanticEvent, { dose: '7' });

  assert.equal(result.transition.doseUnits, 7);
  assert.deepEqual(result.transition.context, { kind: 'preserve' });
  assert.deepEqual(result.transition.preparation, {
    preparation: 'NovoRapid',
    preparationId: 'insulin.prep.aspart_novorapid',
  });
});

test('a governed legacy context initializes the selection without being written on an untouched save', () => {
  const governedLegacyEvent = {
    context: 'Перед едой',
    doseUnits: 4,
    preparation: 'NovoRapid',
  };
  const selection = createInsulinEditSelection(governedLegacyEvent);

  assert.equal(selection.administrationContext, 'before_meal');
  assert.equal(selection.contextEdited, false);

  const result = transition(governedLegacyEvent, { dose: '5' });

  assert.deepEqual(result.transition.context, { kind: 'preserve' });
});

test('unmatched legacy context text is preserved and not silently mapped', () => {
  const selection = createInsulinEditSelection(legacyEvent);

  assert.equal(selection.administrationContext, null);
  assert.equal(
    resolveInsulinEditLegacyContextText(legacyEvent),
    'Перед завтраком',
  );
  assert.deepEqual(transition(legacyEvent).transition.context, {
    kind: 'preserve',
  });
});

test('reverting an edited context back to the recorded text preserves the legacy field', () => {
  const result = transition(legacyEvent, {
    administrationContext: null,
    contextEdited: true,
  });

  assert.deepEqual(result.transition.context, { kind: 'preserve' });
});

test('an event with no context at all initializes to the unspecified selection', () => {
  const selection = createInsulinEditSelection({
    doseUnits: 4,
    preparation: 'NovoRapid',
  });

  assert.equal(selection.administrationContext, 'unspecified');
  assert.equal(selection.contextEdited, false);
  assert.equal(
    resolveInsulinEditLegacyContextText({
      doseUnits: 4,
      preparation: 'NovoRapid',
    }),
    null,
  );
});

test('the UI dose guard rejects values at or below zero and above 100', () => {
  assert.equal(INSULIN_EDIT_UI_DOSE_MAXIMUM, 100);

  for (const dose of ['0', '-1', '-0.5', '101', '500', '', 'abc']) {
    const result = transition(semanticEvent, { dose });

    assert.equal(result.ok, false);
    assert.equal(result.errors.dose, 'insulin.dose.out_of_ui_bound');
  }
});

test('the UI dose guard accepts boundary and fractional values without rounding', () => {
  for (const [dose, expected] of [
    ['0.5', 0.5],
    ['1', 1],
    ['4,5', 4.5],
    ['12.25', 12.25],
    ['100', 100],
  ]) {
    const result = transition(semanticEvent, { dose });

    assert.equal(result.ok, true);
    assert.equal(result.transition.doseUnits, expected);
  }
});

test('a blank Other name and an invalid dose are reported together', () => {
  const result = transition(semanticEvent, {
    dose: '0',
    otherName: '',
    preparationId: 'insulin.prep.other',
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, {
    dose: 'insulin.dose.out_of_ui_bound',
    otherName: 'insulin.preparation.other_name_required',
  });
});

test('catalogue identity A can never be saved with the snapshot of catalogue entry B', () => {
  const catalogueIds = [
    'insulin.prep.aspart_novorapid',
    'insulin.prep.aspart_fiasp',
    'insulin.prep.lispro_humalog',
    'insulin.prep.glulisine_apidra',
    'insulin.prep.glargine_lantus',
    'insulin.prep.degludec_tresiba',
  ];

  for (const selected of catalogueIds) {
    const result = transition(semanticEvent, { preparationId: selected });
    const { preparation, preparationId } = result.transition.preparation;

    assert.equal(preparationId, selected);

    const expected =
      selected === semanticEvent.preparationId
        ? semanticEvent.preparation
        : labels.preparations[selected];

    assert.equal(preparation, expected);

    for (const other of catalogueIds) {
      if (other === selected) {
        continue;
      }

      assert.notEqual(preparation, labels.preparations[other]);
    }
  }
});
