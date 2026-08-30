import assert from 'node:assert/strict';
import test from 'node:test';

import { INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS } from './insulin-presentation-dose-format.ts';

test('insulin presentation dose format preserves stored precision without rounding', () => {
  assert.deepEqual(INSULIN_PRESENTATION_DOSE_FORMAT_OPTIONS, {
    maximumFractionDigits: 20,
    minimumFractionDigits: 0,
  });
});
