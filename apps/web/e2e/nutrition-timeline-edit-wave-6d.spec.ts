import { type Browser } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';
import {
  clearTimelineEventsInIndexedDb,
  seedSemanticTimelineEventInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';

interface RawNutritionEvent {
  readonly carbohydratesGrams?: number;
  readonly id?: string;
  readonly items?: readonly {
    readonly itemId?: string;
    readonly name?: string;
    readonly productId?: string;
  }[];
  readonly kind?: string;
  readonly mealType?: string;
  readonly mode?: string;
  readonly note?: string;
  readonly products?: unknown;
  readonly schemaVersion?: number;
}

const LOCALES = [
  {
    breakfast: 'Breakfast',
    carbs: 'Carbohydrates',
    edit: 'Edit',
    editTitle: 'Edit nutrition',
    locale: 'en-GB',
    mealType: /Meal type/,
    mealTypeSheet: 'Meal type',
    openEvent: /Open event:/,
    openQuickAdd: /Quick add: Nutrition/,
    save: 'Save',
    timeline: 'Timeline',
  },
  {
    breakfast: 'Frühstück',
    carbs: 'Kohlenhydrate',
    edit: 'Bearbeiten',
    editTitle: 'Ernährung bearbeiten',
    locale: 'de-DE',
    mealType: /Mahlzeitentyp/,
    mealTypeSheet: 'Mahlzeitentyp',
    openEvent: /Ereignis öffnen:/,
    openQuickAdd: /Schnell hinzufügen: Ernährung/,
    save: 'Speichern',
    timeline: 'Verlauf',
  },
  {
    breakfast: 'Сніданок',
    carbs: 'Вуглеводи',
    edit: 'Редагувати',
    editTitle: 'Редагувати харчування',
    locale: 'uk-UA',
    mealType: /Тип прийому їжі/,
    mealTypeSheet: 'Тип прийому їжі',
    openEvent: /Відкрити подію:/,
    openQuickAdd: /Швидке додавання: Харчування/,
    save: 'Зберегти',
    timeline: 'Хронологія',
  },
  {
    breakfast: 'Завтрак',
    carbs: 'Углеводы',
    edit: 'Редактировать',
    editTitle: 'Редактировать питание',
    locale: 'ru-RU',
    mealType: /Тип приёма пищи/,
    mealTypeSheet: 'Тип приёма пищи',
    openEvent: /Открыть событие:/,
    openQuickAdd: /Быстрое добавление: Питание/,
    save: 'Сохранить',
    timeline: 'Хроника',
  },
] as const;

async function createLocalizedPage(browser: Browser, locale: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale },
    locale,
  });

  return { context, page: await context.newPage() };
}

async function readNutritionEventById(
  page: Page,
  eventId: string,
): Promise<RawNutritionEvent | null> {
  return page.evaluate(async (id) => {
    return new Promise<RawNutritionEvent | null>((resolve, reject) => {
      const request = indexedDB.open('diabetes-universe-timeline');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('timeline_events', 'readonly');
        const getRequest = transaction.objectStore('timeline_events').get(id);

        getRequest.onerror = () => {
          database.close();
          reject(getRequest.error);
        };
        getRequest.onsuccess = () => {
          database.close();
          resolve(
            (getRequest.result?.event as RawNutritionEvent | undefined) ?? null,
          );
        };
      };
    });
  }, eventId);
}

async function readLatestManualNutritionEvent(
  page: Page,
): Promise<RawNutritionEvent | null> {
  return page.evaluate(async () => {
    return new Promise<RawNutritionEvent | null>((resolve, reject) => {
      const request = indexedDB.open('diabetes-universe-timeline');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('timeline_events', 'readonly');
        const getAll = transaction.objectStore('timeline_events').getAll();

        getAll.onerror = () => {
          database.close();
          reject(getAll.error);
        };
        getAll.onsuccess = () => {
          database.close();
          const rows = (getAll.result ?? []) as readonly {
            readonly event?: RawNutritionEvent;
          }[];
          const nutritionEvents = rows
            .map((row) => row.event)
            .filter(
              (event): event is RawNutritionEvent =>
                event?.kind === 'nutrition' && event?.schemaVersion === 2,
            );

          resolve(nutritionEvents.at(-1) ?? null);
        };
      };
    });
  });
}

for (const copy of LOCALES) {
  test(`nutrition detail edit persists canonical v2 in ${copy.locale}`, async ({
    browser,
  }) => {
    const { context, page } = await createLocalizedPage(browser, copy.locale);

    await page.goto('/');
    await waitForApplicationReady(page);
    await page.getByRole('button', { name: copy.openQuickAdd }).click();
    await page.getByRole('button', { name: copy.mealType }).click();
    await page
      .getByRole('dialog', { name: copy.mealTypeSheet, exact: true })
      .getByRole('button', { name: copy.breakfast, exact: true })
      .click();
    await page.getByRole('textbox', { name: copy.carbs }).fill('12.12');
    await page.getByRole('button', { name: copy.save }).click();
    await expect(page.getByRole('textbox', { name: copy.carbs })).toHaveCount(
      0,
    );

    await page.goto('/timeline');
    await waitForApplicationReady(page);
    await page.getByRole('button', { name: copy.openEvent }).first().click();
    await page.getByRole('button', { name: copy.edit }).click();
    await expect(
      page.getByRole('dialog', { name: copy.editTitle }),
    ).toBeVisible();

    await page.locator('#timeline-nutrition-edit-carbs').fill('18');
    await page.locator('#timeline-nutrition-edit-note').fill('edited note');
    await page.getByRole('button', { name: copy.save }).click();
    await expect(
      page.getByRole('dialog', { name: copy.editTitle }),
    ).toHaveCount(0);
    await expect(page.getByText('edited note')).toBeVisible();

    const stored = await readLatestManualNutritionEvent(page);
    expect(stored?.schemaVersion).toBe(2);
    expect(stored?.carbohydratesGrams).toBe(18);
    expect(stored?.note).toBe('edited note');
    expect(stored?.id).toBeTruthy();

    const eventId = stored?.id;
    await page.reload();
    await waitForApplicationReady(page);
    const afterReload = await readNutritionEventById(page, eventId ?? '');
    expect(afterReload?.id).toBe(eventId);
    expect(afterReload?.schemaVersion).toBe(2);
    expect(afterReload?.carbohydratesGrams).toBe(18);
    expect(afterReload?.note).toBe('edited note');

    await context.close();
  });
}

test('legacy nutrition v1 is adopted to v2 only after a successful edit', async ({
  page,
}) => {
  const eventId = 'nutrition-legacy-adoption-e2e';
  const occurredAt = '2026-08-02T05:20:00.000Z';

  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await seedSemanticTimelineEventInIndexedDb(page, {
    carbohydratesGrams: 42,
    createdAt: occurredAt,
    id: eventId,
    kind: 'nutrition',
    mealType: 'Завтрак',
    mode: 'products',
    note: 'legacy seed',
    occurredAt,
    products: [
      {
        calculatedCarbsGrams: 16.8,
        carbsPer100Grams: 14,
        productId: 'apple',
        productName: 'Apple',
        weightGrams: 120,
      },
    ],
    schemaVersion: 1,
    source: 'manual',
    updatedAt: occurredAt,
  });
  await page.reload();
  await waitForApplicationReady(page);

  const beforeEdit = await readNutritionEventById(page, eventId);
  expect(beforeEdit?.schemaVersion).toBe(1);
  expect(beforeEdit?.mode).toBe('products');

  await page
    .getByRole('button', { name: /Open event:/ })
    .first()
    .click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByRole('heading', { name: 'Завтрак' })).toBeVisible();
  await expect(detail.getByText('Apple')).toBeVisible();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Edit nutrition' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Edit nutrition' }),
  ).toHaveCount(0);

  await page.reload();
  await waitForApplicationReady(page);
  const afterReload = await readNutritionEventById(page, eventId);
  expect(afterReload?.id).toBe(eventId);
  expect(afterReload?.schemaVersion).toBe(2);
  expect(afterReload?.mealType).toBe('breakfast');
  expect(afterReload?.carbohydratesGrams).toBe(42);
  expect(Object.hasOwn(afterReload ?? {}, 'mode')).toBe(false);
  expect(Object.hasOwn(afterReload ?? {}, 'products')).toBe(false);
  expect(afterReload?.items?.[0]?.name).toBe('Apple');
  expect(afterReload?.items?.[0]?.itemId).not.toBe('apple');
  expect(Object.hasOwn(afterReload?.items?.[0] ?? {}, 'productId')).toBe(false);
});
