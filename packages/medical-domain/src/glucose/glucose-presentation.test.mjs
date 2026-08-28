import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGlucosePresentation } from './glucose-presentation.ts';

const target = {
  highMmolPerL: 10,
  lowMmolPerL: 4,
  source: 'user_defined',
};

test('buildGlucosePresentation preserves canonical mmol/L', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mg_per_dl',
    reading: {
      concentrationMmolPerL: 6.84,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime: '2026-01-01T12:00:00.000Z',
    targetRange: target,
  });

  assert.equal(presentation.canonicalMmolPerL, 6.84);
  assert.equal(presentation.displayValue, 123);
  assert.equal(presentation.rangeState, 'in_range');
});

test('buildGlucosePresentation keeps range unknown without user target', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: 6.5,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'device',
    },
    referenceTime: '2026-01-01T12:00:00.000Z',
  });

  assert.equal(presentation.rangeState, 'unknown');
});

test('buildGlucosePresentation suppresses range when data quality is invalid', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: Number.NaN,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime: '2026-01-01T12:00:00.000Z',
    targetRange: target,
  });

  assert.equal(presentation.dataQualityState, 'invalid');
  assert.equal(presentation.rangeState, 'unknown');
});
