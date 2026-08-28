import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { adaptGlucosePresentationForDisplay } from './glucose-presentation-adapter.ts';

test('adaptGlucosePresentationForDisplay localizes without mutating canonical value', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const result = adaptGlucosePresentationForDisplay(runtime.formatter, {
    displayUnit: 'mmol_per_l',
    reading: {
      concentrationMmolPerL: 6.84,
      measuredAt: '2026-01-01T10:00:00.000Z',
      source: 'manual',
    },
    referenceTime: '2026-01-01T12:00:00.000Z',
  });

  assert.equal(result.model.canonicalMmolPerL, 6.84);
  assert.equal(result.model.displayValue, 6.8);
  assert.match(result.formattedMeasurement, /6\.8/);
});
