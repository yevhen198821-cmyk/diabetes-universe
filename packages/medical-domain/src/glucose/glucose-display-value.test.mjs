import assert from 'node:assert/strict';
import test from 'node:test';

import { toGlucoseDisplayNumericValue } from './glucose-display-value.ts';

test('toGlucoseDisplayNumericValue rounds mmol/L to one fractional digit', () => {
  assert.equal(toGlucoseDisplayNumericValue(6.84, 'mmol_per_l'), 6.8);
  assert.equal(toGlucoseDisplayNumericValue(4, 'mmol_per_l'), 4);
});

test('toGlucoseDisplayNumericValue rounds mg/dL to integer', () => {
  assert.equal(toGlucoseDisplayNumericValue(6.84, 'mg_per_dl'), 123);
});

test('toGlucoseDisplayNumericValue does not mutate canonical input', () => {
  const canonical = 7.3;
  const display = toGlucoseDisplayNumericValue(canonical, 'mg_per_dl');

  assert.equal(canonical, 7.3);
  assert.notEqual(display, canonical);
});
