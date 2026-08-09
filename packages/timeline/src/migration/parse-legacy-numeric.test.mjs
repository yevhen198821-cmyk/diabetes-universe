import assert from 'node:assert/strict';
import test from 'node:test';

import { parseLegacyLeadingNumber } from './parse-legacy-numeric.ts';

test('parseLegacyLeadingNumber supports comma decimals', () => {
  assert.deepEqual(parseLegacyLeadingNumber('6,4 ммоль/л'), { value: 6.4 });
});

test('parseLegacyLeadingNumber supports dot decimals', () => {
  assert.deepEqual(parseLegacyLeadingNumber('7.3 ммоль/л'), { value: 7.3 });
});

test('parseLegacyLeadingNumber returns null for non-numeric values', () => {
  assert.equal(parseLegacyLeadingNumber('не число'), null);
});
