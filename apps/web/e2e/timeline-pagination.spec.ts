import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const eventCards = (page: Page) =>
  page.getByRole('button', { name: /Open event/ });

async function openTimelineQuickAdd(page: Page) {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
}

test('timeline toolbar keeps filtered totals for the active window', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(page.getByText('31 events')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Events of the day', exact: true }),
  ).toBeVisible();
});

test('timeline search keeps composable filtering with day-scoped list', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByLabel('Search events').fill('NovoRapid');

  await expect(
    page
      .getByLabel('Timeline search and filters')
      .getByText('1 event', { exact: true }),
  ).toBeVisible();
  await expect(eventCards(page).first()).toBeVisible();
});

test('timeline filter reset restores default toolbar totals', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Notes' }).click();

  await expect(page.getByText('25 events')).toBeVisible();

  await page
    .getByLabel('Timeline search and filters')
    .getByRole('button', { name: 'Clear filters' })
    .click();

  await expect(page.getByText('31 events')).toBeVisible();
});

test('timeline delete and add update the selected day list', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: /Open event: NovoRapid/ }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await expect(page.getByText('30 events')).toBeVisible();

  await openTimelineQuickAdd(page);
  await page
    .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
    .click();
  await page.getByLabel('Уровень глюкозы').fill('8,8');
  await page.getByRole('button', { name: /Время/ }).click();
  const timePicker = page.getByRole('dialog', { name: 'Выберите время' });

  await timePicker.getByRole('button', { name: '23' }).first().click();
  await timePicker.getByRole('button', { name: '59' }).last().click();
  await timePicker.getByRole('button', { name: 'Готово' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('8.8 mmol/L').first()).toBeVisible();
  await expect(page.getByText('31 events')).toBeVisible();
});

test('timeline load more control stays hidden for day-scoped list without repository history', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const fab = page.locator('#timeline-mobile-quick-add-fab');

  await expect(fab).toBeVisible();

  const layout = await page.evaluate(() => {
    const nav = document.getElementById('dashboard-mobile-nav');
    const fabElement = document.getElementById('timeline-mobile-quick-add-fab');

    return {
      fabInNav: fabElement ? nav?.contains(fabElement) : null,
    };
  });

  expect(layout.fabInNav).toBe(true);

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});
