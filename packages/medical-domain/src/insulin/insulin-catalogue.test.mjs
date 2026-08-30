import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_PREPARATION_IDS,
  INSULIN_PREPARATION_OTHER_ID,
  isInsulinPreparationId,
  resolveInsulinPresentationGrouping,
} from './insulin-catalogue.ts';

const EXPECTED_IDS = [
  'insulin.prep.aspart_novorapid',
  'insulin.prep.aspart_fiasp',
  'insulin.prep.lispro_humalog',
  'insulin.prep.glulisine_apidra',
  'insulin.prep.glargine_lantus',
  'insulin.prep.degludec_tresiba',
  'insulin.prep.other',
];

test('catalogue lists every approved preparation ID once', () => {
  assert.deepEqual([...INSULIN_PREPARATION_IDS], EXPECTED_IDS);
  assert.equal(INSULIN_PREPARATION_OTHER_ID, 'insulin.prep.other');
});

test('isInsulinPreparationId accepts every approved catalogue ID', () => {
  for (const preparationId of INSULIN_PREPARATION_IDS) {
    assert.equal(isInsulinPreparationId(preparationId), true);
  }
});

test('isInsulinPreparationId rejects unknown and unmapped identities', () => {
  assert.equal(isInsulinPreparationId('insulin.prep.unmapped'), false);
  assert.equal(isInsulinPreparationId('NovoRapid'), false);
  assert.equal(isInsulinPreparationId('insulin.prep.aspart_novorapid '), false);
  assert.equal(isInsulinPreparationId(null), false);
  assert.equal(isInsulinPreparationId(undefined), false);
  assert.equal(isInsulinPreparationId(1), false);
});

test('presentation grouping is derived only from known catalogue IDs', () => {
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.aspart_novorapid'),
    'rapid_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.aspart_fiasp'),
    'rapid_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.lispro_humalog'),
    'rapid_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.glulisine_apidra'),
    'rapid_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.glargine_lantus'),
    'long_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.degludec_tresiba'),
    'long_acting',
  );
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.other'),
    'unspecified',
  );
});

test('missing or unknown preparation IDs resolve grouping to unspecified', () => {
  assert.equal(resolveInsulinPresentationGrouping(undefined), 'unspecified');
  assert.equal(resolveInsulinPresentationGrouping(null), 'unspecified');
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.unmapped'),
    'unspecified',
  );
  assert.equal(resolveInsulinPresentationGrouping('Lantus'), 'unspecified');
});

test('catalogue helpers do not infer identity from display text', () => {
  assert.equal(isInsulinPreparationId('НовоРапид'), false);
  assert.equal(resolveInsulinPresentationGrouping('НовоРапид'), 'unspecified');
});

test('exported preparation IDs are frozen and mutation cannot change guards', () => {
  const snapshot = [...INSULIN_PREPARATION_IDS];

  assert.equal(Object.isFrozen(INSULIN_PREPARATION_IDS), true);
  assert.throws(() => {
    INSULIN_PREPARATION_IDS.push('insulin.prep.unmapped');
  }, TypeError);
  assert.throws(() => {
    INSULIN_PREPARATION_IDS[0] = 'insulin.prep.unmapped';
  }, TypeError);
  assert.deepEqual([...INSULIN_PREPARATION_IDS], snapshot);
  assert.equal(isInsulinPreparationId('insulin.prep.unmapped'), false);
  assert.equal(isInsulinPreparationId(snapshot[0]), true);
  assert.equal(
    resolveInsulinPresentationGrouping('insulin.prep.unmapped'),
    'unspecified',
  );
});
