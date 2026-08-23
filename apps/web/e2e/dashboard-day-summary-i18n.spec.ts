import { expect, type Locator, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function metricValue(region: Locator, label: string): Locator {
  return region.locator(`dt:has-text("${label}") + dd`);
}

test('dashboard day summary renders English labels without reminders placeholder', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const daySummary = page.getByRole('region', { name: 'Day summary' });

  await expect(
    page.getByRole('heading', { name: 'Day summary' }),
  ).toBeVisible();
  await expect(page.getByText('Current day')).toBeVisible();
  await expect(page.getByText('Glucose measurements')).toBeVisible();
  await expect(page.getByText('Total insulin')).toBeVisible();
  await expect(page.getByText('Total carbohydrates')).toBeVisible();
  await expect(page.getByText('Medication doses')).toBeVisible();
  await expect(page.getByText('Reminders')).toHaveCount(0);
  await expect(page.getByText('Сводка дня')).toHaveCount(0);
  await expect(daySummary.locator('time')).toBeVisible();
  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('2');
  await expect(daySummary.getByText('4 U')).toBeVisible();
  await expect(daySummary.getByText('42 g')).toBeVisible();
  await expect(metricValue(daySummary, 'Medication doses')).toHaveText('1');

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
    .click();
  await page.getByLabel('Уровень глюкозы').fill('7,7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('3');

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('3');
});
