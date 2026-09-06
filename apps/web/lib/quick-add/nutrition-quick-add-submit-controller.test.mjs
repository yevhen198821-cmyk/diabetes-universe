import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveNutritionQuickAddLabels } from '../../components/quick-add/nutrition-quick-add-labels.ts';
import { createTestPlatformRuntime } from '../platform/react/testing/create-test-platform-runtime.ts';
import {
  buildNutritionDemoItemWriteSnapshot,
  findNutritionDemoProductById,
} from './nutrition-demo-products.ts';
import {
  createNutritionQuickAddSubmitIdentityState,
  persistPreparedNutritionQuickAddSubmit,
  prepareNutritionQuickAddSubmitWithIdentity,
  resetNutritionQuickAddSubmitIdentity,
} from './nutrition-quick-add-submit-controller.ts';
import { serializeNutritionQuickAddRetryPayload } from './nutrition-quick-add-submit.ts';

const baseManualInput = {
  carbohydratesGrams: 12.12,
  mealType: 'breakfast',
  note: 'after walk',
  time: '08:30',
};

async function prepareAndPersist({ identity, input, onSubmit }) {
  const prepared = prepareNutritionQuickAddSubmitWithIdentity({
    identity,
    input,
  });

  if (prepared.type === 'invalid') {
    return { prepared, persist: null };
  }

  const persist = await persistPreparedNutritionQuickAddSubmit({
    identity,
    onSubmit,
    request: prepared.request,
  });

  return { prepared, persist };
}

test('prepareNutritionQuickAddSubmitWithIdentity rejects invalid carbs without creating submit identity', () => {
  const identity = createNutritionQuickAddSubmitIdentityState();

  const prepared = prepareNutritionQuickAddSubmitWithIdentity({
    identity,
    input: { ...baseManualInput, carbohydratesGrams: Number.NaN },
  });

  assert.equal(prepared.type, 'invalid');
  assert.equal(identity.pendingEventId, null);
});

test('prepareNutritionQuickAddSubmitWithIdentity prepares stable request for valid entry', () => {
  const identity = createNutritionQuickAddSubmitIdentityState();

  const prepared = prepareNutritionQuickAddSubmitWithIdentity({
    identity,
    input: baseManualInput,
  });

  assert.equal(prepared.type, 'prepared');
  assert.match(prepared.request.eventId, /^nutrition-0830-/);
  assert.equal(prepared.request.entry.mealType, 'breakfast');
  assert.equal(prepared.request.entry.carbohydratesGrams, 12.12);
});

test('persistPreparedNutritionQuickAddSubmit preserves identity on failure', async () => {
  const identity = createNutritionQuickAddSubmitIdentityState();
  const prepared = prepareNutritionQuickAddSubmitWithIdentity({
    identity,
    input: baseManualInput,
  });

  assert.equal(prepared.type, 'prepared');

  const result = await persistPreparedNutritionQuickAddSubmit({
    identity,
    onSubmit: async () => {
      throw new Error('write failed');
    },
    request: prepared.request,
  });

  assert.equal(result.type, 'error');
  assert.equal(identity.pendingEventId, prepared.request.eventId);
});

test('failure then unchanged retry reuses the same stable full event id', async () => {
  const identity = createNutritionQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    identity,
    input: baseManualInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  await prepareAndPersist({
    identity,
    input: baseManualInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.equal(eventIds.length, 2);
  assert.equal(eventIds[0], eventIds[1]);
});

for (const { field, firstInput, secondInput } of [
  {
    field: 'mealType',
    firstInput: baseManualInput,
    secondInput: { ...baseManualInput, mealType: 'lunch' },
  },
  {
    field: 'time',
    firstInput: baseManualInput,
    secondInput: { ...baseManualInput, time: '08:31' },
  },
  {
    field: 'note',
    firstInput: baseManualInput,
    secondInput: { ...baseManualInput, note: 'before work' },
  },
]) {
  test(`failure then changed ${field} allocates a new event id`, async () => {
    const identity = createNutritionQuickAddSubmitIdentityState();
    const eventIds = [];
    let attempt = 0;

    await prepareAndPersist({
      identity,
      input: firstInput,
      onSubmit: async (request) => {
        eventIds.push(request.eventId);
        attempt += 1;
        if (attempt === 1) {
          throw new Error('write failed');
        }
      },
    });

    await prepareAndPersist({
      identity,
      input: secondInput,
      onSubmit: async (request) => {
        eventIds.push(request.eventId);
      },
    });

    assert.notEqual(eventIds[0], eventIds[1]);
  });
}

test('failure then changed carbs allocates a new event id', async () => {
  const identity = createNutritionQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;

  await prepareAndPersist({
    identity,
    input: baseManualInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  await prepareAndPersist({
    identity,
    input: { ...baseManualInput, carbohydratesGrams: 15 },
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.notEqual(eventIds[0], eventIds[1]);
});

test('failure then changed itemized payload allocates a new event id', async () => {
  const product = findNutritionDemoProductById('apple');
  assert.ok(product);

  const identity = createNutritionQuickAddSubmitIdentityState();
  const eventIds = [];
  let attempt = 0;
  const itemInput = {
    carbohydratesGrams: 14,
    items: [
      buildNutritionDemoItemWriteSnapshot({
        itemId: 'nutrition-item-1',
        product,
        weightGrams: 100,
      }),
    ],
    mealType: 'lunch',
    time: '13:00',
  };

  await prepareAndPersist({
    identity,
    input: itemInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  await prepareAndPersist({
    identity,
    input: {
      ...itemInput,
      items: [
        buildNutritionDemoItemWriteSnapshot({
          itemId: 'nutrition-item-1',
          product,
          weightGrams: 120,
        }),
      ],
      carbohydratesGrams: 16.8,
    },
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
    },
  });

  assert.notEqual(eventIds[0], eventIds[1]);
});

test('locale-only change after failed itemized submit keeps the same event id and items payload', async () => {
  const product = findNutritionDemoProductById('apple');
  assert.ok(product);

  const identity = createNutritionQuickAddSubmitIdentityState();
  const eventIds = [];
  const payloads = [];
  let attempt = 0;
  const itemInput = {
    carbohydratesGrams: 14,
    items: [
      buildNutritionDemoItemWriteSnapshot({
        itemId: 'nutrition-item-locale-neutral',
        product,
        weightGrams: 100,
      }),
    ],
    mealType: 'lunch',
    time: '13:00',
  };

  await prepareAndPersist({
    identity,
    input: itemInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      payloads.push(serializeNutritionQuickAddRetryPayload(request.entry));
      attempt += 1;
      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  const runtimeDe = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });
  const labelsDe = resolveNutritionQuickAddLabels(runtimeDe.localization);
  assert.notEqual(labelsDe.demoProducts.apple, product.canonicalSnapshotName);

  await prepareAndPersist({
    identity,
    input: itemInput,
    onSubmit: async (request) => {
      eventIds.push(request.eventId);
      payloads.push(serializeNutritionQuickAddRetryPayload(request.entry));
    },
  });

  assert.equal(eventIds.length, 2);
  assert.equal(eventIds[0], eventIds[1]);
  assert.equal(payloads.length, 2);
  assert.equal(payloads[0], payloads[1]);
  assert.equal(
    JSON.parse(payloads[0]).items[0].name,
    product.canonicalSnapshotName,
  );
});

test('resetNutritionQuickAddSubmitIdentity clears pending identity explicitly', () => {
  const identity = createNutritionQuickAddSubmitIdentityState();

  prepareNutritionQuickAddSubmitWithIdentity({
    identity,
    input: baseManualInput,
  });
  assert.notEqual(identity.pendingEventId, null);

  resetNutritionQuickAddSubmitIdentity(identity);
  assert.equal(identity.pendingEventId, null);
  assert.equal(identity.pendingRetryPayloadKey, null);
});
