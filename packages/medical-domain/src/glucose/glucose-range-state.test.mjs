import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGlucoseRangeState } from './glucose-range-state.ts';

const target = {
  lowMmolPerL: 4,
  highMmolPerL: 8,
  source: 'user_defined',
};

test('resolveGlucoseRangeState classifies below lower bound', () => {
  assert.equal(resolveGlucoseRangeState(3.9, target), 'below_range');
});

test('resolveGlucoseRangeState treats lower bound as in range', () => {
  assert.equal(resolveGlucoseRangeState(4, target), 'in_range');
});

test('resolveGlucoseRangeState classifies inside range', () => {
  assert.equal(resolveGlucoseRangeState(6, target), 'in_range');
});

test('resolveGlucoseRangeState treats upper bound as in range', () => {
  assert.equal(resolveGlucoseRangeState(8, target), 'in_range');
});

test('resolveGlucoseRangeState classifies above upper bound', () => {
  assert.equal(resolveGlucoseRangeState(8.1, target), 'above_range');
});

test('resolveGlucoseRangeState returns unknown without user target', () => {
  assert.equal(resolveGlucoseRangeState(6, null), 'unknown');
  assert.equal(resolveGlucoseRangeState(6, undefined), 'unknown');
});

test('resolveGlucoseRangeState returns unknown for invalid target', () => {
  assert.equal(
    resolveGlucoseRangeState(6, {
      highMmolPerL: 4,
      lowMmolPerL: 8,
      source: 'user_defined',
    }),
    'unknown',
  );
});

test('resolveGlucoseRangeState returns unknown for non-finite value', () => {
  assert.equal(resolveGlucoseRangeState(Number.NaN, target), 'unknown');
});
