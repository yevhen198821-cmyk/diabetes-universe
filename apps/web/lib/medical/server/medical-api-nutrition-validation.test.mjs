import assert from 'node:assert/strict';
import test from 'node:test';
import {
  validateCreateRequestBody,
  validateUpdateRequestBody,
} from './medical-api-validation.ts';
import { validateAdoptionBatchBody } from './medical-adoption-validation.ts';

const canonical = {
  kind: 'nutrition',
  schemaVersion: 2,
  source: 'manual',
  occurredAt: '2026-09-10T12:00:00.000Z',
  mealType: 'breakfast',
  carbohydratesGrams: 12.12,
};
const writers = {
  create: (event) => validateCreateRequestBody({ event }),
  update: (event) => validateUpdateRequestBody({ event }),
  adoption: (event) =>
    validateAdoptionBatchBody({
      items: [
        {
          sourceNamespace: 'browser-1',
          localEventId: 'meal-1',
          sourceSchemaVersion: event.schemaVersion,
          event,
        },
      ],
    })[0].event,
};
for (const [name, write] of Object.entries(writers)) {
  test(`${name} preserves canonical nutrition v2 totals and item snapshots`, () => {
    for (const event of [
      canonical,
      {
        ...canonical,
        items: [
          {
            itemId: 'item-1',
            name: 'Bread',
            carbohydratesGrams: 15,
            weightGrams: 50,
            carbsPer100Grams: 30,
          },
        ],
      },
    ]) {
      assert.deepEqual(write(event), event);
    }
  });
  test(`${name} rejects invalid nutrition v2 without accepting legacy fields`, () => {
    for (const patch of [
      { carbohydratesGrams: -1 },
      { carbohydratesGrams: 1001 },
      { carbohydratesGrams: NaN },
      { mealType: 'unknown' },
      { items: [] },
      { mode: 'manual' },
      { products: [] },
      {
        items: [
          {
            itemId: 'item-1',
            name: 'Bread',
            carbohydratesGrams: 15,
            subjectId: 'other',
          },
        ],
      },
      {
        items: Array.from({ length: 101 }, () => ({
          itemId: 'item-1',
          name: 'Bread',
          carbohydratesGrams: 1,
        })),
      },
      { note: 'x'.repeat(10001) },
    ]) {
      assert.throws(() => write({ ...canonical, ...patch }));
    }
  });
  test(`${name} retains legacy nutrition and rejects v2 for other event kinds`, () => {
    const legacy = {
      ...canonical,
      schemaVersion: 1,
      mode: 'manual',
      carbohydratesGrams: 1500,
    };
    assert.deepEqual(write(legacy), legacy);
    assert.throws(() => write({ ...legacy, items: [] }));
    assert.throws(() =>
      write({
        kind: 'glucose',
        schemaVersion: 2,
        source: 'manual',
        occurredAt: canonical.occurredAt,
        concentrationMmolPerL: 5.5,
      }),
    );
  });
}
