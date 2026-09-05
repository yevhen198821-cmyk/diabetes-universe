import assert from 'node:assert/strict';
import test from 'node:test';

import { createSemanticNutritionTimelineEvent } from '../timeline/semantic-creators/create-semantic-nutrition-timeline-event.ts';
import {
  buildNutritionQuickAddItemSnapshot,
  createNutritionItemCarbsSnapshot,
  prepareNutritionQuickAddSubmit,
  sumNutritionItemCarbohydrates,
} from './nutrition-quick-add-submit.ts';

const fixedClock = {
  now: () => new Date('2026-09-05T10:15:00.000Z'),
};

test('manual submit writes canonical v2 fields only', () => {
  const prepared = prepareNutritionQuickAddSubmit({
    carbohydratesGrams: 12.12,
    mealType: 'breakfast',
    note: '  after walk  ',
    time: '09:30',
  });

  assert.equal(prepared.ok, true);
  if (!prepared.ok) {
    return;
  }

  assert.equal(prepared.value.mealType, 'breakfast');
  assert.equal(prepared.value.carbohydratesGrams, 12.12);
  assert.equal(Object.is(prepared.value.carbohydratesGrams, 12.12), true);
  assert.equal(prepared.value.note, 'after walk');
  assert.equal(Object.hasOwn(prepared.value, 'mode'), false);
  assert.equal(Object.hasOwn(prepared.value, 'products'), false);
  assert.equal(Object.hasOwn(prepared.value, 'calculatedCarbsGrams'), false);
  assert.equal(Object.hasOwn(prepared.value, 'items'), false);

  const event = createSemanticNutritionTimelineEvent(prepared.value, {
    clock: fixedClock,
    id: 'nutrition-manual-1',
  });

  assert.equal(event.kind, 'nutrition');
  assert.equal(event.schemaVersion, 2);
  assert.equal(event.mealType, 'breakfast');
  assert.equal(event.carbohydratesGrams, 12.12);
  assert.equal(event.source, 'manual');
  assert.equal(Object.hasOwn(event, 'mode'), false);
  assert.equal(Object.hasOwn(event, 'products'), false);
  assert.equal(Object.hasOwn(event, 'calculatedCarbsGrams'), false);
  assert.equal(Object.hasOwn(event, 'items'), false);
  assert.equal(Object.hasOwn(event, 'productId'), false);
});

test('itemized submit stores snapshots and an authoritative item-sum total', () => {
  const first = buildNutritionQuickAddItemSnapshot({
    carbsPer100Grams: 43,
    itemId: 'nutrition-item-1',
    name: 'Wholegrain bread',
    weightGrams: 50,
  });
  const second = buildNutritionQuickAddItemSnapshot({
    carbsPer100Grams: 14,
    itemId: 'nutrition-item-2',
    name: 'Apple',
    weightGrams: 120,
  });
  const items = [first, second];
  const total = sumNutritionItemCarbohydrates(items);
  const prepared = prepareNutritionQuickAddSubmit({
    carbohydratesGrams: total,
    items,
    mealType: 'lunch',
    time: '13:00',
  });

  assert.equal(prepared.ok, true);
  if (!prepared.ok) {
    return;
  }

  assert.equal(first.itemId, 'nutrition-item-1');
  assert.equal(first.name, 'Wholegrain bread');
  assert.equal(first.weightGrams, 50);
  assert.equal(first.carbsPer100Grams, 43);
  assert.equal(first.carbohydratesGrams, (50 * 43) / 100);
  assert.equal(second.carbohydratesGrams, (120 * 14) / 100);
  assert.equal(
    prepared.value.carbohydratesGrams,
    first.carbohydratesGrams + second.carbohydratesGrams,
  );
  assert.equal(Object.hasOwn(first, 'productId'), false);
  assert.equal(Object.hasOwn(first, 'calculatedCarbsGrams'), false);

  const event = createSemanticNutritionTimelineEvent(prepared.value, {
    clock: fixedClock,
    id: 'nutrition-items-1',
  });

  assert.equal(event.schemaVersion, 2);
  assert.deepEqual(event.items, items);
  assert.equal(event.carbohydratesGrams, total);
  assert.equal(Object.hasOwn(event, 'mode'), false);
  assert.equal(Object.hasOwn(event, 'products'), false);
  assert.equal(
    event.items?.some((item) => Object.hasOwn(item, 'productId')),
    false,
  );
});

test('item carbs snapshot is the exact JS product used as the historical value', () => {
  const carbs = createNutritionItemCarbsSnapshot(80, 12.5);

  assert.equal(carbs, (80 * 12.5) / 100);
  assert.equal(Object.is(carbs, 10), true);
});

test('itemId stays the opaque form identity and is not derived from the name', () => {
  const apple = buildNutritionQuickAddItemSnapshot({
    carbsPer100Grams: 14,
    itemId: 'nutrition-item-7',
    name: 'Яблоко',
    weightGrams: 100,
  });
  const banana = buildNutritionQuickAddItemSnapshot({
    carbsPer100Grams: 23,
    itemId: 'nutrition-item-7',
    name: 'Банан',
    weightGrams: 100,
  });

  assert.equal(apple.itemId, banana.itemId);
  assert.notEqual(apple.itemId, apple.name);
  assert.notEqual(apple.itemId, 'apple');
});

test('unspecified and localized meal labels are rejected as Quick Add writes', () => {
  assert.equal(
    prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12,
      mealType: 'unspecified',
      time: '09:00',
    }).ok,
    false,
  );
  assert.equal(
    prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12,
      mealType: 'Завтрак',
      time: '09:00',
    }).ok,
    false,
  );
  assert.equal(
    prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12,
      mealType: 'Breakfast',
      time: '09:00',
    }).ok,
    false,
  );
});

test('empty items and missing time are rejected', () => {
  assert.equal(
    prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12,
      items: [],
      mealType: 'snack',
      time: '09:00',
    }).ok,
    false,
  );
  assert.equal(
    prepareNutritionQuickAddSubmit({
      carbohydratesGrams: 12,
      mealType: 'snack',
      time: '   ',
    }).ok,
    false,
  );
});
