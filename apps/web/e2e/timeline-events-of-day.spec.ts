import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('timeline loads events of the day map and day period groups', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'Events of the day', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Tap an event to view details.')).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Day navigation' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Morning' })).toBeVisible();
});

test('timeline marker tap opens understandable event details', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const marker = page.getByRole('button', { name: /NovoRapid/i }).first();
  await marker.click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();
});

test('timeline category filter updates map markers and grouped list', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Insulin' }).click();

  await expect(page.getByText('NovoRapid').first()).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Events of the day timeline' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Events of the day timeline' })
      .getByRole('button', { name: /Glucose/i }),
  ).toHaveCount(0);
});

test('timeline day navigation moves between days within active window', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const dayLabel = page.locator('nav[aria-label="Day navigation"] p').first();
  const initialLabel = await dayLabel.textContent();

  await page.getByRole('button', { name: 'Previous day' }).click();

  await expect(dayLabel).not.toHaveText(initialLabel ?? '');
  await page.getByRole('button', { name: 'Next day' }).click();
  await expect(dayLabel).toHaveText(initialLabel ?? '');
});

test('timeline night group appears only when night events exist', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(page.getByRole('heading', { name: 'Night' })).toHaveCount(0);
});

test('timeline FAB is embedded in bottom navigation and opens quick add', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const nav = page.locator('#dashboard-mobile-nav');
  const fab = nav.locator('#timeline-mobile-quick-add-fab');
  const navBox = await nav.boundingBox();
  const fabBox = await fab.boundingBox();

  expect(navBox).not.toBeNull();
  expect(fabBox).not.toBeNull();

  if (navBox && fabBox) {
    expect(fabBox.x).toBeGreaterThanOrEqual(navBox.x);
    expect(fabBox.x + fabBox.width).toBeLessThanOrEqual(
      navBox.x + navBox.width,
    );
  }

  await fab.click();
  await expect(
    page.getByRole('dialog', { name: /Add event|Добавить событие/ }),
  ).toBeVisible();
});

test('home keeps bottom navigation without FAB', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(page.locator('#timeline-mobile-quick-add-fab')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Notes' })).toBeVisible();
});

test('timeline mobile layout avoids horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});
