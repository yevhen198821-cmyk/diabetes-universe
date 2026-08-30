import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_ADMINISTRATION_CONTEXTS,
  INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM,
  INSULIN_PREPARATION_IDS,
  INSULIN_PREPARATION_OTHER_ID,
  isInsulinAdministrationContext,
  isInsulinPreparationId,
  mapLegacyInsulinAdministrationContext,
  prepareInsulinNewWrite,
  resolveInsulinNewWriteAdministrationContext,
  resolveInsulinPresentationGrouping,
  validateInsulinCanonicalDose,
} from '../index.ts';

test('public root exports expose insulin catalogue, dose, context, and write helpers', () => {
  assert.equal(INSULIN_PREPARATION_OTHER_ID, 'insulin.prep.other');
  assert.equal(INSULIN_PREPARATION_IDS.length, 7);
  assert.equal(INSULIN_ADMINISTRATION_CONTEXTS.length, 6);
  assert.equal(INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM, 500);
  assert.equal(isInsulinPreparationId('insulin.prep.aspart_fiasp'), true);
  assert.equal(isInsulinAdministrationContext('correction'), true);
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.glargine_lantus'),
    'long_acting',
  );
  assert.deepEqual(validateInsulinCanonicalDose(6), {
    ok: true,
    doseUnits: 6,
  });
  assert.deepEqual(resolveInsulinNewWriteAdministrationContext(undefined), {
    ok: true,
    administrationContext: 'unspecified',
  });
  assert.deepEqual(mapLegacyInsulinAdministrationContext('Коррекция'), {
    matched: true,
    administrationContext: 'correction',
  });
  assert.equal(
    prepareInsulinNewWrite({
      preparationId: 'insulin.prep.glulisine_apidra',
      preparation: 'Apidra',
      doseUnits: 3,
    }).ok,
    true,
  );
});
