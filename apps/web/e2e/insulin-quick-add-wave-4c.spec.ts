import { type Browser } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const PREPARATION_TRIGGER = /Insulin preparation/;
const DOSE_LABEL = 'Insulin dose';
const CONTEXT_TRIGGER = /Administration context/;
const OTHER_NAME_LABEL = 'Preparation name';
const PREPARATION_SHEET = 'Insulin preparation';
const CONTEXT_SHEET = 'Administration context';

/**
 * Demo timeline rows reuse the same localized labels as the option sheets, so
 * every option click is scoped to the sheet dialog.
 */
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

/**
 * Reads the newest manually-recorded insulin row straight out of IndexedDB.
 *
 * Card text alone cannot prove which keys were persisted, so the semantic
 * contract is asserted against the stored record.
 */
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

async function openInsulinQuickAdd(page: Page) {
  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toBeVisible();
}

async function openTimelineInsulinQuickAdd(page: Page) {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toBeVisible();
}

test('dashboard insulin quick add writes a semantic event with exact dose precision', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Lantus');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('12.25');
  await selectContext(page, 'Basal');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveCount(0);

  const recentEvents = page.getByRole('region', { name: 'Recent events' });

  await expect(recentEvents.getByText('Lantus')).toBeVisible();
  await expect(recentEvents.getByText('12.25 U')).toBeVisible();

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored).not.toBeNull();
  expect(stored?.preparationId).toBe('insulin.prep.glargine_lantus');
  expect(stored?.preparation).toBe('Lantus');
  expect(stored?.doseUnits).toBe(12.25);
  expect(stored?.administrationContext).toBe('basal');
  expect(stored?.schemaVersion).toBe(1);
  expect(stored?.source).toBe('manual');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'preparationCategory')).toBe(false);
});

test('the stored insulin event drives timeline card and detail presentation', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Fiasp');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('12.25');
  await selectContext(page, 'Correction');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('link', { name: 'All events' }).click();
  await waitForApplicationReady(page);

  const card = page.getByRole('button', {
    name: /Open event: Fiasp, 12\.25 U, .*, Correction/,
  });

  await expect(card).toBeVisible();

  await card.click();

  const detail = page.getByRole('dialog', { name: 'Fiasp' });

  await expect(detail.getByText('12.25 U')).toBeVisible();
  await expect(detail.getByText('Correction')).toBeVisible();
  await expect(detail.getByText('Rapid-acting insulin')).toHaveCount(0);
});

test('timeline insulin quick add honours the same semantic contract', async ({
  page,
}) => {
  await openTimelineInsulinQuickAdd(page);

  await selectPreparation(page, 'Humalog');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('4,5');
  await selectContext(page, 'After meal');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveCount(0);

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.lispro_humalog');
  expect(stored?.preparation).toBe('Humalog');
  expect(stored?.doseUnits).toBe(4.5);
  expect(stored?.administrationContext).toBe('after_meal');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
});

test('Other requires a name and stores the user text as the snapshot', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Other');

  const otherName = page.getByRole('textbox', { name: OTHER_NAME_LABEL });

  await expect(otherName).toBeVisible();
  await expect(otherName).toHaveValue('');

  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('6');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('alert').filter({ hasText: 'Enter the preparation name.' }),
  ).toBeVisible();
  await expect(otherName).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toBeVisible();

  await otherName.fill('  Pharmacy own-brand insulin  ');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveCount(0);

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.other');
  expect(stored?.preparation).toBe('Pharmacy own-brand insulin');
  expect(stored?.doseUnits).toBe(6);
  expect(stored?.preparation).not.toBe('Other');
  expect(stored?.preparation).not.toBe('Другое');
});

test('switching from Other to a catalogue entry stores the catalogue snapshot', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Other');
  await page
    .getByRole('textbox', { name: OTHER_NAME_LABEL })
    .fill('Pharmacy own-brand insulin');
  await selectPreparation(page, 'Tresiba');

  await expect(
    page.getByRole('textbox', { name: OTHER_NAME_LABEL }),
  ).toHaveCount(0);

  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('8');
  await page.getByRole('button', { name: 'Save' }).click();

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.degludec_tresiba');
  expect(stored?.preparation).toBe('Tresiba');
  expect(stored?.preparation).not.toBe('Pharmacy own-brand insulin');
});

test('no context choice stores the semantic unspecified value', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Apidra');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('3');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveCount(0);

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.administrationContext).toBe('unspecified');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
});

test('explicitly choosing Not specified stores the same semantic value', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'Apidra');
  await page.getByRole('textbox', { name: DOSE_LABEL }).fill('3');
  await selectContext(page, 'Not specified');
  await page.getByRole('button', { name: 'Save' }).click();

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.administrationContext).toBe('unspecified');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
});

test('the manual dose guard rejects invalid input with technical copy only', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await selectPreparation(page, 'NovoRapid');

  const dose = page.getByRole('textbox', { name: DOSE_LABEL });

  for (const invalid of ['0', '101', '4.125']) {
    await dose.fill(invalid);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(dose).toBeVisible();
    await expect(
      page
        .getByRole('alert')
        .filter({ hasText: 'Enter a dose greater than 0' }),
    ).toBeVisible();
    await expect(dose).toHaveAttribute('aria-invalid', 'true');
    await expect(
      page.getByText(/safe dose|recommended dose|correct dose/i),
    ).toHaveCount(0);
  }

  await dose.fill('12.25');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(dose).toHaveCount(0);
});

test('the insulin preparation sheet groups catalogue entries as localized chrome', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);
  await page.getByRole('button', { name: PREPARATION_TRIGGER }).click();

  const sheet = page.getByRole('dialog', { name: 'Insulin preparation' });

  await expect(sheet.getByText('Rapid-acting insulin')).toBeVisible();
  await expect(sheet.getByText('Long-acting insulin')).toBeVisible();
  await expect(sheet.getByText('Быстрый инсулин')).toHaveCount(0);
  await expect(sheet.getByText('insulin.prep.')).toHaveCount(0);
});

test('the dose field offers no pre-filled or suggested dose', async ({
  page,
}) => {
  await openInsulinQuickAdd(page);

  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveValue('');
  await expect(page.getByRole('textbox', { name: DOSE_LABEL })).toHaveAttribute(
    'placeholder',
    '4',
  );
});

async function createLocalizedPage(browser: Browser, locale: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale },
    locale,
  });

  return { context, page: await context.newPage() };
}

test('insulin quick add is localized in Russian without English form chrome', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'ru-RU');

  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: /Инсулин/ }).click();

  await expect(
    page.getByRole('textbox', { name: 'Доза инсулина' }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Insulin dose' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: /Препарат инсулина/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Контекст введения/ }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Препарат инсулина/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByRole('textbox', { name: 'Доза инсулина' }).fill('4,5');
  await page.getByRole('button', { name: /Контекст введения/ }).click();
  await page.getByRole('button', { name: 'Коррекция' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).click();

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.aspart_novorapid');
  expect(stored?.preparation).toBe('NovoRapid');
  expect(stored?.doseUnits).toBe(4.5);
  expect(stored?.administrationContext).toBe('correction');

  await context.close();
});

test('insulin quick add is localized in German and writes a semantic event', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'de-DE');

  await page.goto('/');
  await waitForApplicationReady(page);
  await page
    .getByRole('button', { name: /Insulin/ })
    .first()
    .click();

  await expect(
    page.getByRole('textbox', { name: 'Insulindosis' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Insulinpräparat/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Verabreichungskontext/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: 'Доза инсулина' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: /Insulinpräparat/ }).click();
  await page
    .getByRole('dialog', { name: 'Insulinpräparat', exact: true })
    .getByRole('button', { name: 'Lantus', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Insulindosis' }).fill('12,25');
  await page.getByRole('button', { name: /Verabreichungskontext/ }).click();
  await page
    .getByRole('dialog', { name: 'Verabreichungskontext', exact: true })
    .getByRole('button', { name: 'Basal', exact: true })
    .click();
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('textbox', { name: 'Insulindosis' })).toHaveCount(
    0,
  );

  const stored = await readLatestManualInsulinEvent(page);

  expect(stored?.preparationId).toBe('insulin.prep.glargine_lantus');
  expect(stored?.preparation).toBe('Lantus');
  expect(stored?.doseUnits).toBe(12.25);
  expect(stored?.administrationContext).toBe('basal');
  expect(stored?.schemaVersion).toBe(1);
  expect(stored?.source).toBe('manual');
  expect(Object.hasOwn(stored ?? {}, 'context')).toBe(false);
  expect(Object.hasOwn(stored ?? {}, 'preparationCategory')).toBe(false);

  await context.close();
});
