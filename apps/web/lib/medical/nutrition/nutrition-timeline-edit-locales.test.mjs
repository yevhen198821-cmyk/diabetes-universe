import assert from 'node:assert/strict';
import test from 'node:test';

import { presentNutritionFromTimelineEvent } from './present-nutrition-from-timeline-event.ts';
import { createTestPlatformRuntime } from '../../platform/react/testing/create-test-platform-runtime.ts';
import { resolveTimelinePresentationLabels } from '../../timeline/presentation/timeline-presentation-labels.ts';

const event = {
  carbohydratesGrams: 42,
  createdAt: '2026-09-05T08:00:00.000Z',
  id: 'nutrition-locale',
  kind: 'nutrition',
  mealType: 'breakfast',
  occurredAt: '2026-09-05T08:00:00.000Z',
  schemaVersion: 2,
  source: 'manual',
  updatedAt: '2026-09-05T08:00:00.000Z',
};

const expected = {
  'de-DE': 'Frühstück',
  'en-GB': 'Breakfast',
  'ru-RU': 'Завтрак',
  'uk-UA': 'Сніданок',
};

for (const [locale, mealLabel] of Object.entries(expected)) {
  test(`nutrition detail localizes breakfast as ${mealLabel} in ${locale}`, async () => {
    const runtime = await createTestPlatformRuntime({
      request: { acceptLanguage: locale, cookieTimeZone: 'Europe/Berlin' },
    });
    const labels = resolveTimelinePresentationLabels(runtime.localization);
    const presentation = presentNutritionFromTimelineEvent({
      event,
      formatter: runtime.formatter,
      labels: {
        carbsPer100: 'per100',
        carbohydrates: 'carbs',
        itemCarbs: 'item',
        itemWeight: 'weight',
        items: 'items',
        mealType: 'meal',
        mealTypes: labels.mealTypes,
      },
    });

    assert.equal(presentation.mealTypeDisplay, mealLabel);
  });
}
