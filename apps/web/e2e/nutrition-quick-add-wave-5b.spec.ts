import { type Browser } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

interface RawNutritionEvent {
  readonly calculatedCarbsGrams?: number;
  readonly carbohydratesGrams?: number;
  readonly items?: readonly {
    readonly carbsPer100Grams?: number;
    readonly itemId?: string;
    readonly name?: string;
    readonly productId?: string;
    readonly weightGrams?: number;
  }[];
  readonly kind?: string;
  readonly mealType?: string;
  readonly mode?: string;
  readonly occurredAt?: string;
  readonly products?: unknown;
  readonly schemaVersion?: number;
  readonly source?: string;
}

const LOCALES = [
  {
    breakfast: 'Breakfast',
    carbs: 'Carbohydrates',
    locale: 'en-GB',
    mealType: /Meal type/,
    mealTypeSheet: 'Meal type',
    openQuickAdd: /Quick add: Nutrition/,
    recentEvents: 'Recent events',
    save: 'Save',
    timelineMeal: 'Breakfast',
  },
  {
    breakfast: 'Frühstück',
    carbs: 'Kohlenhydrate',
    locale: 'de-DE',
    mealType: /Mahlzeitentyp/,
    mealTypeSheet: 'Mahlzeitentyp',
    openQuickAdd: /Schnell hinzufügen: Ernährung/,
    recentEvents: 'Letzte Einträge',
    save: 'Speichern',
    timelineMeal: 'Frühstück',
  },
  {
    breakfast: 'Сніданок',
    carbs: 'Вуглеводи',
    locale: 'uk-UA',
    mealType: /Тип прийому їжі/,
    mealTypeSheet: 'Тип прийому їжі',
    openQuickAdd: /Швидке додавання: Харчування/,
    recentEvents: 'Останні записи',
    save: 'Зберегти',
    timelineMeal: 'Сніданок',
  },
  {
    breakfast: 'Завтрак',
    carbs: 'Углеводы',
    locale: 'ru-RU',
    mealType: /Тип приёма пищи/,
    mealTypeSheet: 'Тип приёма пищи',
    openQuickAdd: /Быстрое добавление: Питание/,
    recentEvents: 'Последние записи',
    save: 'Сохранить',
    timelineMeal: 'Завтрак',
  },
] as const;

async function createLocalizedPage(browser: Browser, locale: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale },
    locale,
  });

  return { context, page: await context.newPage() };
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
                event?.kind === 'nutrition' && event?.source === 'manual',
            )
            .sort((left, right) =>
              (left.occurredAt ?? '').localeCompare(right.occurredAt ?? ''),
            );

          resolve(nutritionEvents.at(-1) ?? null);
        };
      };
    });
  });
}

function assertCanonicalManualPayload(stored: RawNutritionEvent | null) {
  expect(stored).not.toBeNull();
  expect(stored?.kind).toBe('nutrition');
  expect(stored?.schemaVersion).toBe(2);
  expect(stored?.mealType).toBe('breakfast');
  expect(stored?.carbohydratesGrams).toBe(12.12);
  expect(stored?.source).toBe('manual');
  expect(Object.hasOwn(stored ?? {}, 'mode')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'products')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'calculatedCarbsGrams')).toBe(false);
  expect(stored?.mealType).not.toBe('Breakfast');
  expect(stored?.mealType).not.toBe('Завтрак');
  expect(stored?.mealType).not.toBe('Frühstück');
  expect(stored?.mealType).not.toBe('Сніданок');
}

async function completeManualNutritionFlow(
  page: Page,
  copy: (typeof LOCALES)[number],
) {
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
  await expect(page.getByRole('textbox', { name: copy.carbs })).toHaveCount(0);
}

for (const copy of LOCALES) {
  test(`nutrition quick add writes canonical v2 in ${copy.locale}`, async ({
    browser,
  }) => {
    const { context, page } = await createLocalizedPage(browser, copy.locale);

    await completeManualNutritionFlow(page, copy);

    const recentEvents = page.getByRole('region', { name: copy.recentEvents });
    await expect(
      recentEvents.getByText(copy.timelineMeal).first(),
    ).toBeVisible();

    const stored = await readLatestManualNutritionEvent(page);
    assertCanonicalManualPayload(stored);

    await page.reload();
    await waitForApplicationReady(page);
    await expect(
      page
        .getByRole('region', { name: copy.recentEvents })
        .getByText(copy.timelineMeal)
        .first(),
    ).toBeVisible();

    const afterReload = await readLatestManualNutritionEvent(page);
    assertCanonicalManualPayload(afterReload);

    await context.close();
  });
}

test('itemized nutrition quick add stores snapshots without demo productId', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: 'Quick add: Nutrition' }).click();
  await page
    .locator('label')
    .filter({ has: page.getByRole('radio', { name: 'Items' }) })
    .click();
  await page.getByRole('button', { name: /Meal type/ }).click();
  await page
    .getByRole('dialog', { name: 'Meal type', exact: true })
    .getByRole('button', { name: 'Lunch', exact: true })
    .click();
  await page.getByRole('button', { name: /Item/ }).first().click();
  await page
    .getByRole('dialog', { name: 'Item', exact: true })
    .getByRole('button', { name: 'Apple', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Serving weight' }).fill('100');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('textbox', { name: 'Serving weight' }),
  ).toHaveCount(0);

  const stored = await readLatestManualNutritionEvent(page);

  expect(stored?.schemaVersion).toBe(2);
  expect(stored?.mealType).toBe('lunch');
  expect(stored?.carbohydratesGrams).toBe(14);
  expect(stored?.items).toHaveLength(1);
  expect(stored?.items?.[0]?.name).toBe('Apple');
  expect(stored?.items?.[0]?.weightGrams).toBe(100);
  expect(stored?.items?.[0]?.carbsPer100Grams).toBe(14);
  expect(stored?.items?.[0]?.itemId).toBeTruthy();
  expect(stored?.items?.[0]?.itemId).not.toBe('apple');
  expect(Object.hasOwn(stored?.items?.[0] ?? {}, 'productId')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'mode')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'products')).toBe(false);
});
