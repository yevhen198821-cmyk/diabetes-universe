import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveNutritionQuickAddLabels } from '../../components/quick-add/nutrition-quick-add-labels.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import { createSemanticNutritionTimelineEvent } from '../timeline/semantic-creators/create-semantic-nutrition-timeline-event.ts';
import { prepareNutritionQuickAddSubmit } from './nutrition-quick-add-submit.ts';

const LOCALES = [
  ['en-GB', 'Europe/London'],
  ['de-DE', 'Europe/Berlin'],
  ['uk-UA', 'Europe/Kyiv'],
  ['ru-RU', 'Europe/Moscow'],
];

const fixedClock = {
  now: () => new Date('2026-09-05T08:00:00.000Z'),
};

function omitVolatile(event) {
  const { createdAt, id, occurredAt, updatedAt, ...semantic } = event;
  return semantic;
}

test('the same manual Nutrition write is locale-neutral across all four locales', async () => {
  const payloads = [];

  for (const [acceptLanguage, cookieTimeZone] of LOCALES) {
    const runtime = await createTestPlatformRuntime({
      request: { acceptLanguage, cookieTimeZone },
    });
    const labels = resolveNutritionQuickAddLabels(runtime.localization);

    assert.ok(labels.mealTypes.breakfast.length > 0);
    assert.notEqual(labels.mealTypes.breakfast, 'breakfast');

    const prepared = prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12.12,
      mealType: 'breakfast',
      note: 'locale-neutral note',
      time: '08:30',
    });

    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }

    const event = createSemanticNutritionTimelineEvent(prepared.value, {
      clock: fixedClock,
      id: 'nutrition-locale-neutral',
    });

    payloads.push(omitVolatile(event));
  }

  for (const payload of payloads.slice(1)) {
    assert.deepEqual(payload, payloads[0]);
  }

  assert.equal(payloads[0].kind, 'nutrition');
  assert.equal(payloads[0].schemaVersion, 2);
  assert.equal(payloads[0].mealType, 'breakfast');
  assert.equal(payloads[0].carbohydratesGrams, 12.12);
  assert.equal(payloads[0].source, 'manual');
  assert.equal(Object.hasOwn(payloads[0], 'mode'), false);
  assert.equal(Object.hasOwn(payloads[0], 'products'), false);
});
