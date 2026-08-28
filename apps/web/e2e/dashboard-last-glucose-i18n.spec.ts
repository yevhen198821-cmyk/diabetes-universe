import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard last glucose renders English labels and syncs with timeline edits', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });

  await expect(
    page.getByRole('heading', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByText('Последняя глюкоза')).toHaveCount(0);
  await expect(
    lastGlucoseRegion.getByText('7.3', { exact: true }),
  ).toBeVisible();
  await expect(
    lastGlucoseRegion.getByText('mmol/L', { exact: true }),
  ).toBeVisible();
  await expect(lastGlucoseRegion.locator('time')).toBeVisible();

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await page.getByRole('button', { name: 'mmol/L', exact: true }).click();
  await page.getByLabel('Glucose level').fill('7.7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    lastGlucoseRegion.getByText('7.7', { exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: Glucose, 7\.7 mmol\/L/ })
    .click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Value').fill('8.2');
  await page.getByRole('button', { name: 'Save' }).click();
  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('8.2', {
      exact: true,
    }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await page
    .getByRole('button', { name: /Open event: Glucose, 8\.2 mmol\/L/ })
    .click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('7.3', {
      exact: true,
    }),
  ).toBeVisible();
});
