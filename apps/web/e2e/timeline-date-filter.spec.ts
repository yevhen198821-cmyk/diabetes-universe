import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function dateFilterSheet(page: Page) {
  return page.getByRole('dialog', { name: 'Select period' });
}

async function openDateFilterSheet(page: Page) {
  await page.getByRole('button', { name: 'Date range' }).click();
  await expect(dateFilterSheet(page)).toBeVisible();
}

test('timeline defaults to last 30 days', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Last 30 days',
  );
  await expect(page.getByText('31 events')).toBeVisible();
});

test('timeline date selector lists active window presets only', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openDateFilterSheet(page);

  await expect(
    dateFilterSheet(page).getByRole('button', { name: 'Today' }),
  ).toBeVisible();
  await expect(
    dateFilterSheet(page).getByRole('button', { name: 'Last 7 days' }),
  ).toBeVisible();
  await expect(
    dateFilterSheet(page).getByRole('button', { name: 'Last 30 days' }),
  ).toBeVisible();
  await expect(
    dateFilterSheet(page).getByRole('button', { name: 'Last 45 days' }),
  ).toBeVisible();
  await expect(
    dateFilterSheet(page).getByRole('button', { name: 'Custom range' }),
  ).toHaveCount(0);
});

test('timeline last 45 days selection filters within active window', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openDateFilterSheet(page);
  await dateFilterSheet(page)
    .getByRole('button', { name: 'Last 45 days' })
    .click();
  await dateFilterSheet(page).getByRole('button', { name: 'Apply' }).click();

  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Last 45 days',
  );
  await expect(page.getByText('31 events')).toBeVisible();
});

test('timeline combines last 45 days with category filter', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openDateFilterSheet(page);
  await dateFilterSheet(page)
    .getByRole('button', { name: 'Last 45 days' })
    .click();
  await dateFilterSheet(page).getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Insulin' }).click();

  await expect(page.getByText('1 events')).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();
});

test('timeline clear filters preserves selected 45-day range', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openDateFilterSheet(page);
  await dateFilterSheet(page)
    .getByRole('button', { name: 'Last 45 days' })
    .click();
  await dateFilterSheet(page).getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Insulin' }).click();
  await page.getByLabel('Search events').fill('NovoRapid');

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.getByLabel('Search events')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Last 45 days',
  );
  await expect(page.getByText('31 events')).toBeVisible();
});

test('timeline filtered empty result keeps clear filters action', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByLabel('Search events').fill('does-not-exist');

  await expect(
    page.getByRole('heading', { name: 'No matching events' }),
  ).toBeVisible();
  await expect(
    page
      .locator('section', {
        has: page.getByRole('heading', { name: 'No matching events' }),
      })
      .getByRole('button', { name: 'Clear filters' }),
  ).toBeVisible();
});

test('timeline date filter keeps mobile layout without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(page.getByRole('button', { name: 'Date range' })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);

  const fabBox = await page
    .getByRole('button', { name: 'Add event' })
    .boundingBox();

  expect(fabBox).not.toBeNull();
  expect(fabBox?.width).toBeGreaterThan(0);
});
