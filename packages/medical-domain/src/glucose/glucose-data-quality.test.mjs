import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveGlucoseDataQualityState } from './glucose-data-quality.ts';

test('resolveGlucoseDataQualityState marks valid readings', () => {
  assert.equal(
    resolveGlucoseDataQualityState({
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T10:00:00.000Z',
      referenceTime: '2026-01-01T12:00:00.000Z',
    }),
    'valid',
  );
});

test('resolveGlucoseDataQualityState marks future timestamps questionable', () => {
  assert.equal(
    resolveGlucoseDataQualityState({
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T13:00:00.000Z',
      referenceTime: '2026-01-01T12:00:00.000Z',
    }),
    'questionable',
  );
});

test('resolveGlucoseDataQualityState marks invalid concentration', () => {
  assert.equal(
    resolveGlucoseDataQualityState({
      concentrationMmolPerL: Number.POSITIVE_INFINITY,
      measuredAt: '2026-01-01T10:00:00.000Z',
    }),
    'invalid',
  );
});
