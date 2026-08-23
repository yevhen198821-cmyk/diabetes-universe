import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('home renders Wave 1C visual foundation without fabricated identity data', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(page.getByText('Diabetes Universe')).toBeVisible();
  await expect(page.getByText('Anna')).toHaveCount(0);
  await expect(page.getByText('AI insight', { exact: false })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quick add' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Recent events' }),
  ).toBeVisible();
});

test('mobile navigation exposes real destinations without analytics placeholder', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await waitForApplicationReady(page);

  const navigation = page.getByRole('navigation');

  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Timeline' }),
  ).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0);
  await expect(
    navigation.getByRole('button', { name: 'Add event' }),
  ).toBeVisible();

  await navigation.getByRole('link', { name: 'Timeline' }).click();
  await expect(page).toHaveURL('/timeline');
});

test('quick add category buttons open existing quick add forms', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
