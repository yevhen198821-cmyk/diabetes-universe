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

test('buildGlucosePresentation is deterministic for identical inputs and referenceTime', () => {
  const input = {
    displayUnit: 'mmol_per_l',
    freshnessPolicy: {
      currentWithinMs: 15 * 60 * 1000,
      recentWithinMs: 60 * 60 * 1000,
    },
    reading: {
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime: '2026-01-01T10:10:00.000Z',
    targetRange: target,
  };

  const first = buildGlucosePresentation(input);
  const second = buildGlucosePresentation(input);

  assert.deepEqual(first, second);
});

test('buildGlucosePresentation derives freshness from supplied referenceTime', () => {
  const reading = {
    concentrationMmolPerL: 6.2,
    measuredAt: '2026-01-01T10:00:00.000Z',
    source: 'manual',
  };
  const freshnessPolicy = {
    currentWithinMs: 15 * 60 * 1000,
    recentWithinMs: 60 * 60 * 1000,
  };

  const current = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    freshnessPolicy,
    reading,
    referenceTime: '2026-01-01T10:10:00.000Z',
  });
  const recent = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    freshnessPolicy,
    reading,
    referenceTime: '2026-01-01T10:45:00.000Z',
  });
  const old = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    freshnessPolicy,
    reading,
    referenceTime: '2026-01-01T12:00:00.000Z',
  });

  assert.equal(current.freshnessState, 'current');
  assert.equal(recent.freshnessState, 'recent');
  assert.equal(old.freshnessState, 'old');
});

test('buildGlucosePresentation does not classify future measuredAt as current', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    freshnessPolicy: {
      currentWithinMs: 24 * 60 * 60 * 1000,
      recentWithinMs: 48 * 60 * 60 * 1000,
    },
    reading: {
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T12:00:00.000Z',
      source: 'manual',
    },
    referenceTime: '2026-01-01T10:00:00.000Z',
  });

  assert.equal(presentation.freshnessState, 'unknown');
  assert.equal(presentation.dataQualityState, 'questionable');
});
