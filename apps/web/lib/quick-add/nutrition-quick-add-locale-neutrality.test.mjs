import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveNutritionQuickAddLabels } from '../../components/quick-add/nutrition-quick-add-labels.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import { createSemanticNutritionTimelineEvent } from '../timeline/semantic-creators/create-semantic-nutrition-timeline-event.ts';
import {
  buildNutritionDemoItemWriteSnapshot,
  findNutritionDemoProductById,
} from './nutrition-demo-products.ts';
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
  return {
    carbohydratesGrams: event.carbohydratesGrams,
    kind: event.kind,
    mealType: event.mealType,
    note: event.note,
    schemaVersion: event.schemaVersion,
    source: event.source,
    ...(event.items === undefined ? {} : { items: event.items }),
  };
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

test('the same demo item write is locale-neutral across all four locales', async () => {
  const product = findNutritionDemoProductById('apple');

  assert.ok(product);
  if (!product) {
    return;
  }

  const payloads = [];
  const uiLabels = [];

  for (const [acceptLanguage, cookieTimeZone] of LOCALES) {
    const runtime = await createTestPlatformRuntime({
      request: { acceptLanguage, cookieTimeZone },
    });
    const labels = resolveNutritionQuickAddLabels(runtime.localization);
    const uiLabel = labels.demoProducts.apple;

    assert.ok(uiLabel.length > 0);
    assert.notEqual(uiLabel, 'apple');
    uiLabels.push(uiLabel);

    const items = [
      buildNutritionDemoItemWriteSnapshot({
        itemId: 'nutrition-item-locale-neutral',
        product,
        weightGrams: 100,
      }),
    ];

    assert.equal(items[0].name, product.canonicalSnapshotName);
    assert.notEqual(items[0].name, product.id);
    assert.equal(Object.hasOwn(items[0], 'productId'), false);
    assert.equal(Object.hasOwn(items[0], 'demoProductId'), false);

    if (acceptLanguage !== 'en-GB') {
      assert.notEqual(
        items[0].name,
        uiLabel,
        `${acceptLanguage} UI label must not become the stored snapshot name`,
      );
    }

    const prepared = prepareNutritionQuickAddSubmit({
      carbohydratesGrams: items[0].carbohydratesGrams,
      items,
      mealType: 'lunch',
      time: '13:00',
    });

    assert.equal(prepared.ok, true);
    if (!prepared.ok) {
      return;
    }

    const event = createSemanticNutritionTimelineEvent(prepared.value, {
      clock: fixedClock,
      id: 'nutrition-itemized-locale-neutral',
    });

    payloads.push(omitVolatile(event));
  }

  assert.equal(new Set(uiLabels).size, LOCALES.length);

  for (const payload of payloads.slice(1)) {
    assert.deepEqual(payload, payloads[0]);
    assert.deepEqual(payload.items, payloads[0].items);
  }

  assert.equal(payloads[0].kind, 'nutrition');
  assert.equal(payloads[0].schemaVersion, 2);
  assert.equal(payloads[0].mealType, 'lunch');
  assert.equal(payloads[0].carbohydratesGrams, 14);
  assert.equal(payloads[0].items.length, 1);
  assert.equal(payloads[0].items[0].name, product.canonicalSnapshotName);
  assert.equal(payloads[0].items[0].itemId, 'nutrition-item-locale-neutral');
  assert.equal(payloads[0].items[0].weightGrams, 100);
  assert.equal(payloads[0].items[0].carbsPer100Grams, 14);
  assert.equal(Object.hasOwn(payloads[0], 'mode'), false);
  assert.equal(Object.hasOwn(payloads[0], 'products'), false);
  assert.equal(Object.hasOwn(payloads[0].items[0], 'productId'), false);
  assert.equal(Object.hasOwn(payloads[0].items[0], 'demoProductId'), false);
});
