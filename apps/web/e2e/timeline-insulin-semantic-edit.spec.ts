import { type Browser } from '@playwright/test';

import { expect, test, type Page } from './support/test';

import { CANONICAL_DEMO_LOCAL_DAY_TIME } from '../testing/demo-reference-time';
import { waitForApplicationReady } from './support/wait-for-application-ready';
import {
  seedTimelineEventInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';

const PREPARATION_SELECT_LABEL = 'Insulin preparation';
const CONTEXT_SELECT_LABEL = 'Administration context';
const DOSE_LABEL = 'Insulin dose';
const OTHER_NAME_LABEL = 'Preparation name';

async function createLocalizedPage(browser: Browser, locale: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'Accept-Language': locale },
    locale,
  });
  const page = await context.newPage();

  await page.clock.install({ time: CANONICAL_DEMO_LOCAL_DAY_TIME });

  return { context, page };
}

async function openInsulinDetail(page: Page, name: RegExp) {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const card = page.getByRole('button', { name }).first();

  await card.click();

  return card;
}

async function openInsulinEdit(page: Page, name: RegExp) {
  await openInsulinDetail(page, name);
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
}

test('legacy insulin detail keeps the recorded name and unmatched context verbatim', async ({
  page,
}) => {
  await openInsulinDetail(page, /Open event: NovoRapid/);

  const detail = page.getByRole('dialog', { name: 'NovoRapid' });

  await expect(detail.getByText('Insulin')).toBeVisible();
  await expect(detail.getByText('4 U')).toBeVisible();
  await expect(detail.getByText('Перед завтраком')).toBeVisible();
  await expect(detail.getByText('Not specified')).toHaveCount(0);
  await expect(detail.getByText('Before meal')).toHaveCount(0);
});

test('legacy insulin edit offers the recorded name and text without inventing identity', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  const preparation = page.getByLabel(PREPARATION_SELECT_LABEL);
  const context = page.getByLabel(CONTEXT_SELECT_LABEL);

  await expect(preparation).toHaveValue('');
  await expect(
    preparation.getByRole('option', { name: 'Keep recorded name: NovoRapid' }),
  ).toHaveCount(1);
  await expect(context).toHaveValue('');
  await expect(
    context.getByRole('option', {
      name: 'Keep recorded text: Перед завтраком',
    }),
  ).toHaveCount(1);
  await expect(
    page.getByText(
      'This entry has no catalogue match. The recorded name is kept unless you choose a preparation.',
    ),
  ).toBeVisible();
  await expect(page.getByLabel(OTHER_NAME_LABEL)).toHaveCount(0);
});

test('legacy insulin dose-only edit preserves the snapshot and adds no catalogue identity', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  await page.getByLabel(DOSE_LABEL).fill('6');
  await page.getByRole('button', { name: 'Save' }).click();

  const detail = page.getByRole('dialog', { name: 'NovoRapid' });

  await expect(detail.getByText('6 U')).toBeVisible();
  await expect(detail.getByText('Перед завтраком')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel(PREPARATION_SELECT_LABEL)).toHaveValue('');
  await expect(page.getByLabel(CONTEXT_SELECT_LABEL)).toHaveValue('');
});

test('explicit catalogue and context selection makes insulin semantic and drops legacy text', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  await page
    .getByLabel(PREPARATION_SELECT_LABEL)
    .selectOption('insulin.prep.glargine_lantus');
  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('correction');
  await page.getByRole('button', { name: 'Save' }).click();

  const detail = page.getByRole('dialog', { name: 'Lantus' });

  await expect(detail.getByText('Lantus')).toBeVisible();
  await expect(detail.getByText('Correction')).toBeVisible();
  await expect(detail.getByText('Перед завтраком')).toHaveCount(0);

  await page.getByRole('button', { name: 'Edit' }).click();

  const preparation = page.getByLabel(PREPARATION_SELECT_LABEL);
  const context = page.getByLabel(CONTEXT_SELECT_LABEL);

  await expect(preparation).toHaveValue('insulin.prep.glargine_lantus');
  await expect(context).toHaveValue('correction');
  await expect(
    preparation.getByRole('option', { name: /Keep recorded/ }),
  ).toHaveCount(0);
  await expect(
    context.getByRole('option', { name: /Keep recorded/ }),
  ).toHaveCount(0);
});

test('insulin preparation picker groups catalogue entries under localized chrome', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  const groupLabels = await page
    .getByLabel(PREPARATION_SELECT_LABEL)
    .locator('optgroup')
    .evaluateAll((groups) =>
      groups.map((group) => group.getAttribute('label')),
    );

  expect(groupLabels).toEqual([
    'Rapid-acting insulin',
    'Long-acting insulin',
    'Other insulin',
  ]);
});

test('choosing Other requires a user-entered name and stores it as the snapshot', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  await page
    .getByLabel(PREPARATION_SELECT_LABEL)
    .selectOption('insulin.prep.other');

  const otherName = page.getByLabel(OTHER_NAME_LABEL);

  await expect(otherName).toBeVisible();
  await expect(otherName).toHaveValue('');

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Enter the preparation name.' }),
  ).toBeVisible();
  await expect(otherName).toHaveAttribute('aria-invalid', 'true');

  await otherName.fill('Pharmacy own-brand insulin');
  await page.getByRole('button', { name: 'Save' }).click();

  const detail = page.getByRole('dialog', {
    name: 'Pharmacy own-brand insulin',
  });

  await expect(detail.getByText('Pharmacy own-brand insulin')).toBeVisible();
  await expect(detail.getByText('Other', { exact: true })).toHaveCount(0);
});

test('insulin dose guard rejects zero and above 100 with technical copy only', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  const dose = page.getByLabel(DOSE_LABEL);
  const editDialog = page.getByRole('dialog', { name: 'Edit event' });

  for (const invalid of ['0', '101']) {
    await dose.fill(invalid);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(editDialog).toBeVisible();
    await expect(
      page.getByRole('alert').filter({
        hasText: 'Enter a dose greater than 0 and no more than 100',
      }),
    ).toBeVisible();
    await expect(dose).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByText(/safe dose|recommended dose/i)).toHaveCount(0);
  }

  await dose.fill('12.5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(editDialog).toBeHidden();
  await expect(
    page.getByRole('dialog', { name: 'NovoRapid' }).getByText('12.5 U'),
  ).toBeVisible();
});

test('dashboard recent events match the timeline insulin presentation', async ({
  page,
}) => {
  await openInsulinEdit(page, /Open event: NovoRapid/);

  await page
    .getByLabel(PREPARATION_SELECT_LABEL)
    .selectOption('insulin.prep.aspart_fiasp');
  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('basal');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('dialog', { name: 'Fiasp' }).getByText('Basal'),
  ).toBeVisible();
  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();

  await expect(
    page.getByRole('button', { name: /Open event: Fiasp, 4 U, .*, Basal/ }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Go to home' }).click();

  const recentEvents = page.getByRole('region', { name: 'Recent events' });

  await expect(recentEvents.getByText('Fiasp')).toBeVisible();
  await expect(recentEvents.getByText('4 U')).toBeVisible();
  await expect(recentEvents.getByText('NovoRapid')).toHaveCount(0);
  await expect(recentEvents.getByText('Перед завтраком')).toHaveCount(0);
});

test('timeline search finds insulin by recorded snapshot and unmatched legacy text', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const search = page.getByLabel('Search events');

  await search.fill('NovoRapid');
  await expect(
    page.getByRole('button', { name: /Open event: NovoRapid/ }),
  ).toBeVisible();

  await search.fill('Перед завтраком');
  await expect(
    page.getByRole('button', { name: /Open event: NovoRapid/ }),
  ).toBeVisible();
});

test('insulin semantic edit is localized in Russian without English chrome', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'ru-RU');

  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await page
    .getByRole('button', { name: /NovoRapid/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Редактировать' }).click();

  const preparation = page.getByLabel('Препарат инсулина');
  const insulinContext = page.getByLabel('Контекст введения');

  await expect(page.getByLabel('Доза инсулина')).toBeVisible();
  await expect(preparation).toBeVisible();
  await expect(page.getByLabel(PREPARATION_SELECT_LABEL)).toHaveCount(0);
  await expect(page.getByLabel(DOSE_LABEL)).toHaveCount(0);

  const groupLabels = await preparation
    .locator('optgroup')
    .evaluateAll((groups) =>
      groups.map((group) => group.getAttribute('label')),
    );

  expect(groupLabels).toEqual([
    'Инсулин быстрого действия',
    'Инсулин длительного действия',
    'Другой инсулин',
  ]);

  await preparation.selectOption('insulin.prep.lispro_humalog');
  await insulinContext.selectOption('correction');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  const detail = page.getByRole('dialog', { name: 'Humalog' });

  await expect(detail.getByText('Humalog')).toBeVisible();
  await expect(detail.getByText('Коррекция')).toBeVisible();
  await expect(detail.getByText('Correction')).toHaveCount(0);

  await context.close();
});

test('insulin semantic edit stays usable on a mobile viewport', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await openInsulinEdit(page, /Open event: NovoRapid/);

  for (const label of [
    PREPARATION_SELECT_LABEL,
    DOSE_LABEL,
    CONTEXT_SELECT_LABEL,
  ]) {
    const control = page.getByLabel(label);
    const box = await control.boundingBox();

    expect(box?.height).toBeGreaterThanOrEqual(44);
    expect(box?.width).toBeLessThanOrEqual(390);
  }

  await page.getByLabel(PREPARATION_SELECT_LABEL).focus();
  await expect(page.getByLabel(PREPARATION_SELECT_LABEL)).toBeFocused();

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});

const NO_CONTEXT_INSULIN_EVENT = {
  createdAt: '2026-08-02T05:00:00.000Z',
  doseUnits: 12,
  id: 'insulin-no-context-e2e',
  kind: 'insulin' as const,
  occurredAt: '2026-08-02T23:00:00.000Z',
  preparation: 'Lantus',
  schemaVersion: 1,
  source: 'manual',
  updatedAt: '2026-08-02T05:00:00.000Z',
};

async function openSeededNoContextInsulinEdit(page: Page) {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await seedTimelineEventInIndexedDb(page, NO_CONTEXT_INSULIN_EVENT);
  await page.reload();
  await waitForApplicationReady(page);
  await openInsulinEdit(page, /Open event: Lantus, 12 U/);
}

test('no-context insulin edit separates absence from explicit unspecified', async ({
  page,
}) => {
  await openSeededNoContextInsulinEdit(page);

  const context = page.getByLabel(CONTEXT_SELECT_LABEL);

  await expect(context).toHaveValue('');
  await expect(
    context.getByRole('option', { name: 'No context recorded' }),
  ).toHaveCount(1);
  await expect(
    context.getByRole('option', { name: 'Not specified', exact: true }),
  ).toHaveCount(1);
});

test('no-context insulin dose-only edit omits context fields', async ({
  page,
}) => {
  await openSeededNoContextInsulinEdit(page);

  await page.getByLabel(DOSE_LABEL).fill('12.25');
  await page.getByRole('button', { name: 'Save' }).click();

  const detail = page.getByRole('dialog', { name: 'Lantus' });

  await expect(detail.getByText('12.25 U')).toBeVisible();
  await expect(detail.getByText('Not specified')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel(CONTEXT_SELECT_LABEL)).toHaveValue('');
});

test('explicit unspecified selection on a no-context insulin event persists semantically', async ({
  page,
}) => {
  await openSeededNoContextInsulinEdit(page);

  await page.getByLabel(CONTEXT_SELECT_LABEL).selectOption('unspecified');
  await page.getByRole('button', { name: 'Save' }).click();

  const detail = page.getByRole('dialog', { name: 'Lantus' });

  await expect(detail.getByText('Not specified')).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByLabel(CONTEXT_SELECT_LABEL)).toHaveValue(
    'unspecified',
  );
  await expect(
    page
      .getByLabel(CONTEXT_SELECT_LABEL)
      .getByRole('option', { name: 'No context recorded' }),
  ).toHaveCount(0);
});

test('reverting to no recorded context after another choice preserves absence on save', async ({
  page,
}) => {
  await openSeededNoContextInsulinEdit(page);

  const context = page.getByLabel(CONTEXT_SELECT_LABEL);

  await context.selectOption('correction');
  await expect(
    context.getByRole('option', { name: 'No context recorded' }),
  ).toHaveCount(1);
  await context.selectOption({ label: 'No context recorded' });
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('dialog', { name: 'Lantus' }).getByText('Not specified'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(context).toHaveValue('');
  await expect(
    context.getByRole('option', { name: 'No context recorded' }),
  ).toHaveCount(1);

  const storedEvent = await page.evaluate(async (eventId) => {
    return new Promise<Record<string, unknown> | null>((resolve, reject) => {
      const request = indexedDB.open('diabetes-universe-timeline');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction('timeline_events', 'readonly');
        const getRequest = transaction
          .objectStore('timeline_events')
          .get(eventId);

        getRequest.onerror = () => {
          database.close();
          reject(getRequest.error);
        };
        getRequest.onsuccess = () => {
          database.close();
          const record = getRequest.result as
            { readonly event?: Record<string, unknown> } | undefined;
          resolve(record?.event ?? null);
        };
      };
    });
  }, NO_CONTEXT_INSULIN_EVENT.id);

  expect(storedEvent).not.toBeNull();
  expect(Object.hasOwn(storedEvent ?? {}, 'administrationContext')).toBe(false);
  expect(Object.hasOwn(storedEvent ?? {}, 'context')).toBe(false);
});

test('stored fractional insulin dose displays without rounding on timeline and dashboard', async ({
  page,
}) => {
  await openSeededNoContextInsulinEdit(page);

  await page.getByLabel(DOSE_LABEL).fill('12.25');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('button', { name: /Open event: Lantus, 12\.25 U/ }),
  ).toBeVisible();

  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();
  await page.getByRole('link', { name: 'Go to home' }).click();

  const recentEvents = page.getByRole('region', { name: 'Recent events' });

  await expect(recentEvents.getByText('12.25 U')).toBeVisible();
});
