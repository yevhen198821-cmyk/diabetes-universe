import assert from 'node:assert/strict';
import test from 'node:test';

import { classifyNutritionTimelineEvent } from '@diabetes-universe/medical-domain';

import { createTestTimelineNutritionEditCopy } from '../../../components/timeline/testing/create-test-timeline-nutrition-edit-copy.ts';
import {
  adoptLegacyNutritionProductToItemSnapshot,
  mapKnownLegacyNutritionMealType,
} from './nutrition-timeline-adoption.ts';
import {
  buildNutritionTimelineEventFromEditDraft,
  createNutritionTimelineEventEditDraft,
} from './nutrition-timeline-edit-model.ts';
import { presentNutritionFromTimelineEvent } from './present-nutrition-from-timeline-event.ts';

const now = new Date('2026-09-06T12:00:00.000Z');
const copy = createTestTimelineNutritionEditCopy();

const envelope = {
  createdAt: '2026-09-05T08:00:00.000Z',
  id: 'nutrition-edit-1',
  kind: 'nutrition',
  occurredAt: '2026-09-05T08:00:00.000Z',
  source: 'manual',
  updatedAt: '2026-09-05T08:00:00.000Z',
};

const v2Event = {
  ...envelope,
  carbohydratesGrams: 12.125,
  mealType: 'breakfast',
  note: 'after walk',
  schemaVersion: 2,
};

const itemizedV2 = {
  ...v2Event,
  id: 'nutrition-itemized-1',
  items: [
    {
      carbohydratesGrams: 14,
      carbsPer100Grams: 14,
      itemId: 'nutrition-item-keep',
      name: 'Apple',
      weightGrams: 100,
    },
  ],
};

const v1Event = {
  ...envelope,
  id: 'nutrition-legacy-1',
  carbohydratesGrams: 42,
  mealType: 'Завтрак',
  mode: 'manual',
  note: 'legacy note',
  schemaVersion: 1,
};

const v1Products = {
  ...v1Event,
  id: 'nutrition-legacy-products',
  mode: 'products',
  products: [
    {
      calculatedCarbsGrams: 16.8,
      carbsPer100Grams: 14,
      productId: 'apple',
      productName: 'Apple',
      weightGrams: 120,
    },
  ],
};

function save(event, draftOverrides = {}) {
  const date = '2026-09-05';
  const time = '08:00';
  return buildNutritionTimelineEventFromEditDraft({
    copy,
    draft: {
      ...createNutritionTimelineEventEditDraft(event, date, time),
      ...draftOverrides,
    },
    event,
    now,
  });
}

test('known legacy meal labels map to canonical enums', () => {
  assert.equal(mapKnownLegacyNutritionMealType('Завтрак'), 'breakfast');
  assert.equal(mapKnownLegacyNutritionMealType('Frühstück'), 'breakfast');
  assert.equal(mapKnownLegacyNutritionMealType('Сніданок'), 'breakfast');
  assert.equal(mapKnownLegacyNutritionMealType('Breakfast'), 'breakfast');
  assert.equal(mapKnownLegacyNutritionMealType('Обед'), 'lunch');
  assert.equal(mapKnownLegacyNutritionMealType('Mittagessen'), 'lunch');
  assert.equal(mapKnownLegacyNutritionMealType('Обід'), 'lunch');
  assert.equal(mapKnownLegacyNutritionMealType('Ужин'), 'dinner');
  assert.equal(mapKnownLegacyNutritionMealType('Abendessen'), 'dinner');
  assert.equal(mapKnownLegacyNutritionMealType('Вечеря'), 'dinner');
  assert.equal(mapKnownLegacyNutritionMealType('Перекус'), 'snack');
  assert.equal(mapKnownLegacyNutritionMealType('Другое'), 'other');
  assert.equal(mapKnownLegacyNutritionMealType('Sonstiges'), 'other');
  assert.equal(mapKnownLegacyNutritionMealType('Інше'), 'other');
  assert.equal(mapKnownLegacyNutritionMealType('Late brunch'), null);
});

test('legacy product adoption never promotes productId', () => {
  const adopted = adoptLegacyNutritionProductToItemSnapshot(
    v1Products.products[0],
  );

  assert.ok(adopted);
  assert.equal(adopted.name, 'Apple');
  assert.equal(adopted.carbohydratesGrams, 16.8);
  assert.equal(adopted.weightGrams, 120);
  assert.equal(adopted.carbsPer100Grams, 14);
  assert.notEqual(adopted.itemId, 'apple');
  assert.equal(Object.hasOwn(adopted, 'productId'), false);
});

test('canonical v2 edit preserves event id and unchanged 12.125', () => {
  const result = save(v2Event, { mealType: 'lunch' });

  assert.equal(result.event.id, v2Event.id);
  assert.equal(result.event.createdAt, v2Event.createdAt);
  assert.equal(result.event.carbohydratesGrams, 12.125);
  assert.equal(result.event.mealType, 'lunch');
  assert.equal(result.event.schemaVersion, 2);
  assert.equal(result.event.updatedAt, now.toISOString());
});

for (const carbs of [12.125, 750, 1000]) {
  test(`unchanged canonical carbs ${carbs} remain exactly ${carbs}`, () => {
    const result = save({ ...v2Event, carbohydratesGrams: carbs });

    assert.equal(result.event.carbohydratesGrams, carbs);
  });
}

test('edited manual carbs above 500 are rejected', () => {
  const result = save(v2Event, {
    carbsEdited: true,
    carbohydratesGrams: '501',
  });

  assert.equal(result.event, null);
  assert.equal(result.errors.carbs, copy.errors.carbsRange);
});

test('edited manual carbs with more than two decimals are rejected', () => {
  const result = save(v2Event, {
    carbsEdited: true,
    carbohydratesGrams: '12.125',
  });

  assert.equal(result.event, null);
  assert.equal(result.errors.carbs, copy.errors.carbsPrecision);
});

test('comma decimal input is accepted without rounding', () => {
  const result = save(v2Event, {
    carbsEdited: true,
    carbohydratesGrams: '12,12',
  });

  assert.equal(result.event.carbohydratesGrams, 12.12);
});

test('unchanged item snapshot and itemId stay exact', () => {
  const result = save(itemizedV2, { mealType: 'snack' });

  assert.deepEqual(result.event.items, itemizedV2.items);
  assert.equal(result.event.items[0].itemId, 'nutrition-item-keep');
  assert.equal(result.event.items[0].name, 'Apple');
});

test('removing an item omits items without rewriting the event total', () => {
  const draft = createNutritionTimelineEventEditDraft(
    itemizedV2,
    '2026-09-05',
    '08:00',
  );
  const result = save(itemizedV2, {
    items: [],
    itemsEdited: true,
  });

  assert.equal(draft.items.length, 1);
  assert.equal(result.event.carbohydratesGrams, 12.125);
  assert.equal(result.event.items, undefined);
});

test('note, meal type, and time edits persist on the same event', () => {
  const result = save(v2Event, {
    mealType: 'dinner',
    note: 'before work',
    time: '08:31',
  });

  assert.equal(result.event.id, v2Event.id);
  assert.equal(result.event.mealType, 'dinner');
  assert.equal(result.event.note, 'before work');
  assert.match(result.event.occurredAt, /08:31|07:31/);
});

test('legacy v1 remains classified as v1 until save', () => {
  assert.equal(classifyNutritionTimelineEvent(v1Event).status, 'legacy_v1');
});

test('legacy v1 save adopts canonical v2 and maps known meal', () => {
  const result = save(v1Event);

  assert.equal(result.event.schemaVersion, 2);
  assert.equal(result.event.mealType, 'breakfast');
  assert.equal(result.event.id, v1Event.id);
  assert.equal(result.event.carbohydratesGrams, 42);
  assert.equal(result.event.note, 'legacy note');
  assert.equal(Object.hasOwn(result.event, 'mode'), false);
  assert.equal(Object.hasOwn(result.event, 'products'), false);
});

test('unknown legacy meal cannot save until the user chooses a canonical type', () => {
  const result = save({ ...v1Event, mealType: 'Поздний перекус' });

  assert.equal(result.event, null);
  assert.equal(result.errors.mealType, copy.errors.mealTypeRequired);
});

test('legacy products adopt to new item ids without promoting productId', () => {
  const result = save(v1Products);

  assert.equal(result.event.schemaVersion, 2);
  assert.equal(result.event.items.length, 1);
  assert.equal(result.event.items[0].name, 'Apple');
  assert.equal(result.event.items[0].carbohydratesGrams, 16.8);
  assert.notEqual(result.event.items[0].itemId, 'apple');
  assert.equal(Object.hasOwn(result.event.items[0], 'productId'), false);
});

test('nutrition detail presenter shows v2 items and hides technical fields', () => {
  const presentation = presentNutritionFromTimelineEvent({
    event: itemizedV2,
    formatter: {
      formatNumber(value) {
        return String(value);
      },
    },
    labels: {
      carbsPer100: 'per100',
      carbohydrates: 'Carbs',
      itemCarbs: 'Item carbs',
      itemWeight: 'Weight',
      items: 'Foods',
      mealType: 'Meal',
      mealTypes: {
        breakfast: 'Breakfast',
        dinner: 'Dinner',
        lunch: 'Lunch',
        other: 'Other',
        snack: 'Snack',
        unspecified: 'Not specified',
      },
    },
  });

  assert.equal(presentation.origin, 'canonical_v2');
  assert.equal(presentation.mealTypeDisplay, 'Breakfast');
  assert.equal(presentation.carbohydratesDisplay, '12.125');
  assert.equal(presentation.items[0].name, 'Apple');
  assert.equal(
    JSON.stringify(presentation).includes('nutrition-item-keep'),
    false,
  );
  assert.equal(JSON.stringify(presentation).includes('schemaVersion'), false);
});

test('legacy v1 detail shows stored free-form meal and products', () => {
  const presentation = presentNutritionFromTimelineEvent({
    event: v1Products,
    formatter: {
      formatNumber(value) {
        return String(value);
      },
    },
    labels: {
      carbsPer100: 'per100',
      carbohydrates: 'Carbs',
      itemCarbs: 'Item carbs',
      itemWeight: 'Weight',
      items: 'Foods',
      mealType: 'Meal',
      mealTypes: {
        breakfast: 'Breakfast',
        dinner: 'Dinner',
        lunch: 'Lunch',
        other: 'Other',
        snack: 'Snack',
        unspecified: 'Not specified',
      },
    },
  });

  assert.equal(presentation.origin, 'legacy_v1');
  assert.equal(presentation.mealTypeDisplay, 'Завтрак');
  assert.equal(presentation.items[0].name, 'Apple');
});
