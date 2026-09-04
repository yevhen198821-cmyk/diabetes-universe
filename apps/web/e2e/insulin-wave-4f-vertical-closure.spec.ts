import { type Browser } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import {
  clearTimelineEventsInIndexedDb,
  seedTimelineEventInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const PREPARATION_TRIGGER = /Insulin preparation/;
const DOSE_LABEL = 'Insulin dose';
const CONTEXT_TRIGGER = /Administration context/;
const PREPARATION_SHEET = 'Insulin preparation';
const CONTEXT_SHEET = 'Administration context';
const PREPARATION_SELECT_LABEL = 'Insulin preparation';
const CONTEXT_SELECT_LABEL = 'Administration context';

interface RawInsulinEvent {
  readonly administrationContext?: string;
  readonly context?: string;
  readonly doseUnits?: number;
  readonly kind?: string;
  readonly occurredAt?: string;
  readonly preparation?: string;
  readonly preparationCategory?: string;
  readonly preparationId?: string;
  readonly schemaVersion?: number;
  readonly source?: string;
}

async function chooseSheetOption(
  page: Page,
  sheetTitle: string,
  optionLabel: string,
) {
  await page
    .getByRole('dialog', { name: sheetTitle, exact: true })
    .getByRole('button', { name: optionLabel, exact: true })
    .click();
}

async function selectPreparation(page: Page, optionLabel: string) {
  await page.getByRole('button', { name: PREPARATION_TRIGGER }).click();
  await chooseSheetOption(page, PREPARATION_SHEET, optionLabel);
}

async function selectContext(page: Page, optionLabel: string) {
  await page.getByRole('button', { name: CONTEXT_TRIGGER }).click();
  await chooseSheetOption(page, CONTEXT_SHEET, optionLabel);
}

async function readLatestManualInsulinEvent(
  page: Page,
): Promise<RawInsulinEvent | null> {
  return page.evaluate(async () => {
    return new Promise<RawInsulinEvent | null>((resolve, reject) => {
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
            readonly event?: RawInsulinEvent;
          }[];
          const insulinEvents = rows
            .map((row) => row.event)
            .filter(
              (event): event is RawInsulinEvent =>
                event?.kind === 'insulin' && event?.source === 'manual',
            )
            .sort((left, right) =>
              (left.occurredAt ?? '').localeCompare(right.occurredAt ?? ''),
            );

          resolve(insulinEvents.at(-1) ?? null);
        };
      };
    });
  });
}

async function readInsulinEventById(
  page: Page,
  eventId: string,
): Promise<RawInsulinEvent | null> {
  return page.evaluate(async (id) => {
    return new Promise<RawInsulinEvent | null>((resolve, reject) => {
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
          const record = getRequest.result as
            { readonly event?: RawInsulinEvent } | undefined;
          resolve(record?.event ?? null);
        };
      };
    });
  }, eventId);
}

async function openInsulinQuickAdd(page: Page) {
  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toBeVisible();
}

async function prepareEmptyTimeline(page: Page) {
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
}

async function createLocalizedPage(browser: Browser, locale: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale },
    locale,
  });

  return { context, page: await context.newPage() };
}

const CANONICAL_HISTORICAL_INSULIN_EVENT = {
  administrationContext: 'correction',
  createdAt: '2026-08-02T05:00:00.000Z',
  doseUnits: 125,
  id: 'wave-4f-canonical-insulin-125',
  kind: 'insulin' as const,
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  preparationId: 'insulin.prep.aspart_novorapid',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:05:00.000Z',
};

const CANONICAL_FRACTIONAL_INSULIN_EVENT = {
  ...CANONICAL_HISTORICAL_INSULIN_EVENT,
  doseUnits: 12.125,
  id: 'wave-4f-canonical-insulin-12-125',
};

test('insulin quick add completes a full Ukrainian semantic submit', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'uk-UA');

  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: /Інсулін/ }).click();

  await page.getByRole('button', { name: /Препарат інсуліну/ }).click();
  await page.getByRole('button', { name: 'Fiasp' }).click();
  await page.getByRole('textbox', { name: 'Доза інсуліну' }).fill('12,25');
  await page.getByRole('button', { name: /Контекст введення/ }).click();
  await page.getByRole('button', { name: 'Корекція' }).click();
  await page.getByRole('button', { name: 'Зберегти' }).click();

  await expect(
    page.getByRole('textbox', { name: 'Доза інсуліну' }),
  ).toHaveCount(0);

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.aspart_fiasp');
  expect(stored?.preparation).toBe('Fiasp');
  expect(stored?.doseUnits).toBe(12.25);
  expect(stored?.administrationContext).toBe('correction');
  expect(stored?.schemaVersion).toBe(1);
  expect(stored?.source).toBe('manual');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'preparationCategory')).toBe(false);

  await context.close();
});

test('insulin vertical closure covers quick add through dashboard after reload', async ({
  page,
}) => {
  await page.goto('/');
  await prepareEmptyTimeline(page);
  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toBeVisible();

  await selectPreparation(page, 'Fiasp');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('12.25');
  await selectContext(page, 'Correction');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveCount(0);

  const storedAfterAdd = await readLatestManualInsulinEvent(page);

  expect(storedAfterAdd).toMatchObject({
    administrationContext: 'correction',
    doseUnits: 12.25,
    kind: 'insulin',
    preparation: 'Fiasp',
    preparationId: 'insulin.prep.aspart_fiasp',
    schemaVersion: 1,
    source: 'manual',
  });
  expect(Object.hasOwn(storedAfterAdd ?? {}, 'context')).toBe(false);
  expect(Object.hasOwn(storedAfterAdd ?? {}, 'preparationCategory')).toBe(
    false,
  );

  const recentEvents = page.getByRole('region', { name: 'Recent events' });

  await expect(recentEvents.getByText('Fiasp')).toBeVisible();
  await expect(recentEvents.getByText('12.25 U')).toBeVisible();

  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const card = page.getByRole('button', {
    name: /Open event: Fiasp, 12\.25 U, .*, Correction/,
  });

  await expect(card).toBeVisible();
  await card.click();

  const detail = page.getByRole('dialog', { name: 'Fiasp' });

  await expect(detail.getByText('12.25 U')).toBeVisible();
  await expect(detail.getByText('Correction')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page
    .getByLabel(PREPARATION_SELECT_LABEL)
    .selectOption('insulin.prep.glargine_lantus');
  await page.getByLabel(DOSE_LABEL).fill('8.5');
  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('basal');
  await page.getByRole('button', { name: 'Save' }).click();

  const storedAfterEdit = await readLatestManualInsulinEvent(page);

  expect(storedAfterEdit).toMatchObject({
    administrationContext: 'basal',
    doseUnits: 8.5,
    preparation: 'Lantus',
    preparationId: 'insulin.prep.glargine_lantus',
  });
  expect(Object.hasOwn(storedAfterEdit ?? {}, 'context')).toBe(false);

  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('button', { name: /Open event: Lantus, 8\.5 U, .*, Basal/ }),
  ).toBeVisible();

  await page
    .getByRole('button', { name: /Open event: Lantus, 8\.5 U, .*, Basal/ })
    .click();

  await expect(page.getByRole('dialog', { name: 'Lantus' })).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Lantus' }).getByText('8.5 U'),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Lantus' }).getByText('Basal'),
  ).toBeVisible();

  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();
  await page.getByRole('link', { name: 'Go to home' }).click();

  const recentAfterReload = page.getByRole('region', { name: 'Recent events' });

  await expect(recentAfterReload.getByText('Lantus')).toBeVisible();
  await expect(recentAfterReload.getByText('8.5 U')).toBeVisible();
});

test('historical canonical insulin dose 125 survives a non-dose edit', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await seedTimelineEventInIndexedDb(page, CANONICAL_HISTORICAL_INSULIN_EVENT);
  await page.reload();
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: NovoRapid, 125 U/ })
    .click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('basal');
  await page.getByRole('button', { name: 'Save' }).click();

  const stored = await readInsulinEventById(
    page,
    CANONICAL_HISTORICAL_INSULIN_EVENT.id,
  );

  expect(stored?.doseUnits).toBe(125);
  expect(stored?.administrationContext).toBe('basal');
  expect(stored?.preparationId).toBe('insulin.prep.aspart_novorapid');
});

test('historical canonical insulin dose 12.125 survives a non-dose edit', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await seedTimelineEventInIndexedDb(page, CANONICAL_FRACTIONAL_INSULIN_EVENT);
  await page.reload();
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: NovoRapid, 12\.125 U/ })
    .click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('before_meal');
  await page.getByRole('button', { name: 'Save' }).click();

  const stored = await readInsulinEventById(
    page,
    CANONICAL_FRACTIONAL_INSULIN_EVENT.id,
  );

  expect(stored?.doseUnits).toBe(12.125);
  expect(stored?.administrationContext).toBe('before_meal');
});
