import { expect, test } from '@playwright/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard header renders localized English copy after platform readiness', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add event' })).toBeVisible();
  await expect(page.locator('header time[datetime]')).toBeVisible();
  await expect(page.getByText('Добавить событие')).toHaveCount(0);

  await page.getByRole('link', { name: 'Все события' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
});
