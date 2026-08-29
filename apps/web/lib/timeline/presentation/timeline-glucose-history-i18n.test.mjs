import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { resolveTimelinePresentationLabels } from './timeline-presentation-labels.ts';

const locales = [
  ['en-GB', 'Current target range'],
  ['ru-RU', 'Текущий целевой диапазон'],
  ['uk-UA', 'Поточний цільовий діапазон'],
  ['de-DE', 'Aktueller Zielbereich'],
];

for (const [locale, expected] of locales) {
  test(`timeline glucose current-range qualifier is localized for ${locale}`, async () => {
    const runtime = await createTestPlatformRuntime({
      request: { acceptLanguage: locale, cookieTimeZone: 'UTC' },
    });
    const labels = resolveTimelinePresentationLabels(runtime.localization);

    assert.equal(labels.glucoseRangeCurrentBasis, expected);
  });
}
