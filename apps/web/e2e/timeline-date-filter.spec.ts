import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('timeline date filter shows active period and filters events', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Last 30 days',
  );
  await expect(page.getByText('31 events')).toBeVisible();

  await page.getByRole('button', { name: 'Date range' }).click();
  await page.getByRole('button', { name: 'Today' }).click();
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Today',
  );
  await expect(page.getByText('5 events')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeHidden();
});

test('timeline custom date range applies inclusive boundaries', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Date range' }).click();
  await page.getByRole('button', { name: 'Custom range' }).click();
  await page.getByLabel('From').fill('2026-07-30');
  await page.getByLabel('To').fill('2026-08-01');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    '30 Jul',
  );
  await expect(page.getByText('2 events')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '30 July' })).toBeVisible();
});

test('timeline combined filters and clear filters preserve date range', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Date range' }).click();
  await page.getByRole('button', { name: 'Last 7 days' }).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByRole('button', { name: 'Insulin' }).click();
  await page.getByLabel('Search events').fill('NovoRapid');

  await expect(page.getByText('1 events')).toBeVisible();

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.getByLabel('Search events')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Date range' })).toContainText(
    'Last 7 days',
  );
  await expect(page.getByText('10 events')).toBeVisible();
});

test('timeline period empty and filtered empty states differ', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Date range' }).click();
  await page.getByRole('button', { name: 'Custom range' }).click();
  await page.getByLabel('From').fill('2026-06-01');
  await page.getByLabel('To').fill('2026-06-02');
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(
    page.getByRole('heading', { name: 'No events for this period' }),
  ).toBeVisible();
  await expect(page.getByText('0 events')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear filters' }),
  ).toBeHidden();

  await page.getByRole('button', { name: 'Date range' }).click();
  await page.getByRole('button', { name: 'Last 30 days' }).click();
  await page.getByRole('button', { name: 'Apply' }).click();
  await page.getByLabel('Search events').fill('does-not-exist');

  await expect(
    page.getByRole('heading', { name: 'No matching events' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Clear filters' }),
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
