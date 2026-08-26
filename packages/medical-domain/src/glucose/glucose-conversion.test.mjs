import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GLUCOSE_MMOL_PER_L_TO_MG_PER_DL,
  convertGlucoseMgPerDlToMmolPerL,
  convertGlucoseMmolPerLToMgPerDl,
} from './glucose-conversion.ts';

test('convertGlucoseMmolPerLToMgPerDl uses approved factor', () => {
  assert.equal(
    convertGlucoseMmolPerLToMgPerDl(1),
    GLUCOSE_MMOL_PER_L_TO_MG_PER_DL,
  );
  assert.equal(convertGlucoseMmolPerLToMgPerDl(5.6), 5.6 * 18.0182);
});

test('convertGlucoseMgPerDlToMmolPerL inverts approved factor', () => {
  assert.equal(convertGlucoseMgPerDlToMmolPerL(180.182), 10);
});

test('conversion round-trip stays within tolerance', () => {
  const original = 6.4;
  const roundTrip = convertGlucoseMgPerDlToMmolPerL(
    convertGlucoseMmolPerLToMgPerDl(original),
  );
  assert.ok(Math.abs(roundTrip - original) < 1e-9);
});

test('conversion does not mutate source event data', () => {
  const event = {
    concentrationMmolPerL: 7.3,
    kind: 'glucose',
  };

  const converted = convertGlucoseMmolPerLToMgPerDl(
    event.concentrationMmolPerL,
  );

  assert.equal(event.concentrationMmolPerL, 7.3);
  assert.notEqual(converted, event.concentrationMmolPerL);
});
