import assert from 'node:assert/strict';
import test from 'node:test';

import {
  INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM,
  INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS,
  validateInsulinCanonicalDose,
} from './insulin-dose.ts';

test('canonical dose accepts the technical boundary and representative fractions', () => {
  assert.deepEqual(validateInsulinCanonicalDose(0.001), {
    ok: true,
    doseUnits: 0.001,
  });
  assert.deepEqual(validateInsulinCanonicalDose(1.25), {
    ok: true,
    doseUnits: 1.25,
  });
  assert.deepEqual(validateInsulinCanonicalDose(100), {
    ok: true,
    doseUnits: 100,
  });
  assert.deepEqual(
    validateInsulinCanonicalDose(INSULIN_CANONICAL_DOSE_TECHNICAL_MAXIMUM),
    { ok: true, doseUnits: 500 },
  );
});

test('canonical dose keeps more than two fractional digits without rounding', () => {
  const value = 2.125;
  const result = validateInsulinCanonicalDose(value);

  assert.deepEqual(result, { ok: true, doseUnits: 2.125 });
  assert.equal(result.ok && result.doseUnits, value);
  assert.equal(result.ok && Object.is(result.doseUnits, value), true);
});

test('canonical dose rejects zero, negative, over-maximum, and non-finite values', () => {
  assert.deepEqual(validateInsulinCanonicalDose(0), {
    ok: false,
    error: 'insulin.dose.not_positive',
  });
  assert.deepEqual(validateInsulinCanonicalDose(-1), {
    ok: false,
    error: 'insulin.dose.not_positive',
  });
  assert.deepEqual(validateInsulinCanonicalDose(500.0001), {
    ok: false,
    error: 'insulin.dose.above_technical_maximum',
  });
  assert.deepEqual(validateInsulinCanonicalDose(Number.NaN), {
    ok: false,
    error: 'insulin.dose.not_finite',
  });
  assert.deepEqual(validateInsulinCanonicalDose(Number.POSITIVE_INFINITY), {
    ok: false,
    error: 'insulin.dose.not_finite',
  });
  assert.deepEqual(validateInsulinCanonicalDose(Number.NEGATIVE_INFINITY), {
    ok: false,
    error: 'insulin.dose.not_finite',
  });
});

test('canonical dose rejects non-number runtime values', () => {
  assert.deepEqual(validateInsulinCanonicalDose('4'), {
    ok: false,
    error: 'insulin.dose.not_a_number',
  });
  assert.deepEqual(validateInsulinCanonicalDose(null), {
    ok: false,
    error: 'insulin.dose.not_a_number',
  });
  assert.deepEqual(validateInsulinCanonicalDose(undefined), {
    ok: false,
    error: 'insulin.dose.not_a_number',
  });
});

test('canonical dose validation is deterministic', () => {
  const first = validateInsulinCanonicalDose(3.14159);
  const second = validateInsulinCanonicalDose(3.14159);

  assert.deepEqual(first, second);
  assert.equal(first.ok && first.doseUnits, 3.14159);
});

test('presentation dose format options preserve stored precision without rounding', () => {
  assert.deepEqual(INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS, {
    maximumFractionDigits: 20,
    minimumFractionDigits: 0,
  });
});
