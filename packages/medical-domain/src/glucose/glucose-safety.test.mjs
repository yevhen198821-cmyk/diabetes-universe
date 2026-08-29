import assert from 'node:assert/strict';
import test from 'node:test';

import { GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS } from './glucose-clock-tolerance.ts';
import { resolveGlucoseDataQualityState } from './glucose-data-quality.ts';
import { resolveGlucoseFreshnessState } from './glucose-freshness-policy.ts';
import { selectLatestEligibleGlucoseReading } from './glucose-latest-selection.ts';
import { isGlucoseReadingEligibleForLatest } from './glucose-reading-eligibility.ts';
import {
  GLUCOSE_PRODUCT_RECENCY_POLICIES,
  resolveGlucoseFreshnessPolicyForSourceCategory,
} from './glucose-product-recency-policy.ts';
import { normalizeGlucoseSourceCategory } from './glucose-source-category.ts';
import { resolveGlucoseTimestampQuality } from './glucose-timestamp-quality.ts';
import { buildGlucosePresentation } from './glucose-presentation.ts';

const referenceTime = '2026-01-01T12:00:00.000Z';
const target = {
  highMmolPerL: 10,
  lowMmolPerL: 4,
  source: 'user_defined',
};

test('manual source selects manual product-recency policy', () => {
  assert.deepEqual(
    resolveGlucoseFreshnessPolicyForSourceCategory('manual'),
    GLUCOSE_PRODUCT_RECENCY_POLICIES.manual,
  );
});

test('cgm source selects cgm product-recency policy', () => {
  assert.deepEqual(
    resolveGlucoseFreshnessPolicyForSourceCategory('cgm'),
    GLUCOSE_PRODUCT_RECENCY_POLICIES.cgm,
  );
});

test('unknown runtime source maps to conservative fallback policy', () => {
  assert.equal(normalizeGlucoseSourceCategory({ source: 'demo' }), 'other');
  assert.deepEqual(
    resolveGlucoseFreshnessPolicyForSourceCategory('other'),
    GLUCOSE_PRODUCT_RECENCY_POLICIES.other,
  );
});

test('freshness uses measuredAt and not later recordedAt', () => {
  const policy = resolveGlucoseFreshnessPolicyForSourceCategory('manual');
  const freshness = resolveGlucoseFreshnessState({
    measuredAt: '2026-01-01T08:00:00.000Z',
    policy,
    referenceTime: '2026-01-01T12:00:00.000Z',
  });

  assert.equal(freshness, 'recent');
});

test('within clock-skew tolerance is not rejected as suspect future', () => {
  const withinToleranceMs = GLUCOSE_FUTURE_CLOCK_SKEW_TOLERANCE_MS - 60_000;

  assert.equal(
    resolveGlucoseTimestampQuality({
      measuredAt: new Date(
        Date.parse(referenceTime) + withinToleranceMs,
      ).toISOString(),
      referenceTime,
    }),
    'valid',
  );
  assert.equal(
    resolveGlucoseDataQualityState({
      concentrationMmolPerL: 6.2,
      measuredAt: new Date(
        Date.parse(referenceTime) + withinToleranceMs,
      ).toISOString(),
      referenceTime,
    }),
    'valid',
  );
});

test('beyond future tolerance becomes suspect and not fresh/current', () => {
  const measuredAt = '2026-01-01T13:00:00.000Z';

  assert.equal(
    resolveGlucoseTimestampQuality({ measuredAt, referenceTime }),
    'suspect_future',
  );
  assert.equal(
    resolveGlucoseFreshnessState({
      measuredAt,
      policy: resolveGlucoseFreshnessPolicyForSourceCategory('manual'),
      referenceTime,
    }),
    'unknown',
  );
});

test('shared glucose safety functions do not depend on hidden system clock', () => {
  const fixedReference = '2026-01-01T12:00:00.000Z';
  const first = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'a',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
    ],
    referenceTime: fixedReference,
  });
  const second = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'a',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
    ],
    referenceTime: fixedReference,
  });

  assert.deepEqual(first, second);
});

test('latest eligible selection chooses newest measuredAt', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 5.5,
        id: 'older',
        measuredAt: '2026-01-01T09:00:00.000Z',
      },
      {
        concentrationMmolPerL: 7.1,
        id: 'newer',
        measuredAt: '2026-01-01T11:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'newer');
});

test('later createdAt metadata does not beat later measuredAt', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.0,
        id: 'late-record',
        measuredAt: '2026-01-01T09:00:00.000Z',
        recordedAt: '2026-01-01T11:30:00.000Z',
      },
      {
        concentrationMmolPerL: 6.5,
        id: 'actual-latest',
        measuredAt: '2026-01-01T10:30:00.000Z',
        recordedAt: '2026-01-01T10:35:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'actual-latest');
});

test('future suspect reading loses to older valid reading', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'valid-older',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
      {
        concentrationMmolPerL: 9.9,
        id: 'future-suspect',
        measuredAt: '2026-01-01T15:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'valid-older');
});

test('deleted reading is excluded when deletion metadata exists', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 8.0,
        deletedAt: '2026-01-01T12:05:00.000Z',
        id: 'deleted',
        measuredAt: '2026-01-01T11:30:00.000Z',
      },
      {
        concentrationMmolPerL: 6.0,
        id: 'active',
        measuredAt: '2026-01-01T09:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'active');
});

test('invalid non-displayable reading is excluded', () => {
  assert.equal(
    isGlucoseReadingEligibleForLatest({
      concentrationMmolPerL: Number.NaN,
      measuredAt: '2026-01-01T10:00:00.000Z',
      referenceTime,
    }),
    false,
  );
});

test('old but valid reading can still be selected', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'old-valid',
        measuredAt: '2025-12-30T10:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'old-valid');
});

test('selection does not depend on glucose magnitude', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 15.0,
        id: 'a-reading',
        measuredAt: '2026-01-01T11:00:00.000Z',
      },
      {
        concentrationMmolPerL: 3.0,
        id: 'b-reading',
        measuredAt: '2026-01-01T11:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'b-reading');
});

test('equal measuredAt resolves deterministically using recordedAt then id', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'b-reading',
        measuredAt: '2026-01-01T10:00:00.000Z',
        recordedAt: '2026-01-01T10:05:00.000Z',
      },
      {
        concentrationMmolPerL: 7.1,
        id: 'a-reading',
        measuredAt: '2026-01-01T10:00:00.000Z',
        recordedAt: '2026-01-01T10:10:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.id, 'a-reading');
});

test('questionable quality suppresses confident range state', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T13:00:00.000Z',
      source: 'manual',
    },
    referenceTime,
    targetRange: target,
  });

  assert.equal(presentation.dataQualityState, 'questionable');
  assert.equal(presentation.rangeState, 'unknown');
});

test('valid quality allows target-relative range state', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime,
    targetRange: target,
  });

  assert.equal(presentation.dataQualityState, 'valid');
  assert.equal(presentation.rangeState, 'in_range');
});

test('no target keeps range unknown without hiding reading value', () => {
  const presentation = buildGlucosePresentation({
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: 6.2,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime,
  });

  assert.equal(presentation.rangeState, 'unknown');
  assert.equal(presentation.displayValue, 6.2);
});

test('conflicting same-time readings are preserved by selection input set', () => {
  const readings = [
    {
      concentrationMmolPerL: 6.2,
      id: 'manual',
      measuredAt: '2026-01-01T10:00:00.000Z',
    },
    {
      concentrationMmolPerL: 7.1,
      id: 'meter',
      measuredAt: '2026-01-01T10:00:00.000Z',
    },
  ];

  assert.equal(readings.length, 2);
  assert.notEqual(
    readings[0].concentrationMmolPerL,
    readings[1].concentrationMmolPerL,
  );
});

test('same value and time are not auto-deduplicated by selection', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 6.2,
        id: 'reading-a',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
      {
        concentrationMmolPerL: 6.2,
        id: 'reading-b',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.ok(selected);
});

test('selection never averages glucose readings', () => {
  const selected = selectLatestEligibleGlucoseReading({
    readings: [
      {
        concentrationMmolPerL: 4.0,
        id: 'a',
        measuredAt: '2026-01-01T11:00:00.000Z',
      },
      {
        concentrationMmolPerL: 10.0,
        id: 'b',
        measuredAt: '2026-01-01T10:00:00.000Z',
      },
    ],
    referenceTime,
  });

  assert.equal(selected?.concentrationMmolPerL, 4.0);
});
