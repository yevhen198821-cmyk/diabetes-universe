import assert from 'node:assert/strict';
import test from 'node:test';

import { INSULIN_PREPARATION_IDS } from './insulin-catalogue.ts';
import { prepareInsulinNewWrite } from './insulin-new-write.ts';

test('prepareInsulinNewWrite accepts every approved catalogue ID with a snapshot', () => {
  for (const preparationId of INSULIN_PREPARATION_IDS) {
    const preparation =
      preparationId === 'insulin.prep.other'
        ? 'User named insulin'
        : 'Snapshot';
    const result = prepareInsulinNewWrite({
      preparationId,
      preparation,
      doseUnits: 4,
      administrationContext: 'before_meal',
    });

    assert.deepEqual(result, {
      ok: true,
      value: {
        preparationId,
        preparation,
        doseUnits: 4,
        administrationContext: 'before_meal',
      },
    });
  }
});

test('prepareInsulinNewWrite requires a trimmed user-entered Other name', () => {
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.other',
      preparation: '   ',
      doseUnits: 4,
    }),
    { ok: false, error: 'insulin.preparation.other_name_required' },
  );
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.other',
      preparation: '',
      doseUnits: 4,
    }),
    { ok: false, error: 'insulin.preparation.other_name_required' },
  );
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.other',
      preparation: '  Custom mix  ',
      doseUnits: 2.5,
    }),
    {
      ok: true,
      value: {
        preparationId: 'insulin.prep.other',
        preparation: 'Custom mix',
        doseUnits: 2.5,
        administrationContext: 'unspecified',
      },
    },
  );
});

test('prepareInsulinNewWrite does not manufacture a localized Other snapshot', () => {
  const result = prepareInsulinNewWrite({
    preparationId: 'insulin.prep.other',
    preparation: null,
    doseUnits: 4,
  });

  assert.deepEqual(result, {
    ok: false,
    error: 'insulin.preparation.other_name_required',
  });
  assert.notEqual(result.ok && result.value?.preparation, 'Other');
  assert.notEqual(result.ok && result.value?.preparation, 'Другое');
});

test('known catalogue selections require a non-empty snapshot', () => {
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.aspart_novorapid',
      preparation: '   ',
      doseUnits: 4,
    }),
    { ok: false, error: 'insulin.preparation.snapshot_empty' },
  );
});

test('unknown and unmapped preparation IDs are rejected', () => {
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.unmapped',
      preparation: 'Unknown',
      doseUnits: 4,
    }),
    { ok: false, error: 'insulin.preparation_id.invalid' },
  );
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'NovoRapid',
      preparation: 'NovoRapid',
      doseUnits: 4,
    }),
    { ok: false, error: 'insulin.preparation_id.invalid' },
  );
});

test('prepared output has no legacy context or preparationCategory', () => {
  const result = prepareInsulinNewWrite({
    preparationId: 'insulin.prep.glargine_lantus',
    preparation: 'Lantus snapshot',
    doseUnits: 12,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    return;
  }

  assert.equal('context' in result.value, false);
  assert.equal('preparationCategory' in result.value, false);
  assert.deepEqual(Object.keys(result.value).sort(), [
    'administrationContext',
    'doseUnits',
    'preparation',
    'preparationId',
  ]);
  assert.equal(result.value.administrationContext, 'unspecified');
});

test('prepareInsulinNewWrite surfaces canonical dose errors without rounding', () => {
  assert.deepEqual(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.lispro_humalog',
      preparation: 'Humalog',
      doseUnits: 0,
    }),
    { ok: false, error: 'insulin.dose.not_positive' },
  );

  const precise = prepareInsulinNewWrite({
    preparationId: 'insulin.prep.lispro_humalog',
    preparation: 'Humalog',
    doseUnits: 1.2345,
  });

  assert.equal(precise.ok, true);
  if (precise.ok) {
    assert.equal(precise.value.doseUnits, 1.2345);
  }
});

test('prepareInsulinNewWrite is deterministic and locale-independent', () => {
  const input = {
    preparationId: 'insulin.prep.degludec_tresiba',
    preparation: 'Tresiba',
    doseUnits: 8,
    administrationContext: 'basal',
  };

  assert.deepEqual(
    prepareInsulinNewWrite(input),
    prepareInsulinNewWrite(input),
  );
});
