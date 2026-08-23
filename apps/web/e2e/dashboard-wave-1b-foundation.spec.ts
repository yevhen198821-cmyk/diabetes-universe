import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard renders with semantic foundation in light theme', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByText('Next action').first()).toBeVisible();
});

test('timeline renders with semantic foundation and filter chips', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByLabel('Search events')).toBeVisible();
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
});

test('dark theme foundation applies html class without flash regression', async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('du-ui-theme', 'dark');
  });

  await page.goto('/');
  await waitForApplicationReady(page);

  const themeClass = await page.evaluate(() =>
    document.documentElement.classList.contains('dark'),
  );

  expect(themeClass).toBe(true);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe', exact: true }),
  ).toBeVisible();
});

test('primary dashboard action remains keyboard focusable', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await page.keyboard.press('Tab');

  const focusedRole = await page.evaluate(() => {
    const element = document.activeElement;

    return element?.getAttribute('role') ?? element?.tagName.toLowerCase();
  });

  expect(['link', 'button', 'a']).toContain(focusedRole);
});
