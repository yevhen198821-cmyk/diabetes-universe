import { expect, type Locator, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function metricValue(region: Locator, label: string): Locator {
  return region.locator(`dt:has-text("${label}") + dd`).first();
}

test('dashboard day summary renders English labels without reminders placeholder', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const daySummary = page.getByRole('region', { name: 'Today' });

  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(daySummary.getByText('Glucose', { exact: true })).toBeVisible();
  await expect(daySummary.getByText('Insulin', { exact: true })).toBeVisible();
  await expect(
    daySummary.getByText('Carbohydrates', { exact: true }),
  ).toBeVisible();
  await expect(daySummary.getByText('Activity', { exact: true })).toBeVisible();
  await expect(page.getByText('Reminders')).toHaveCount(0);
  await expect(page.getByText('Medication doses')).toHaveCount(0);
  await expect(page.getByText('Сводка дня')).toHaveCount(0);
  await expect(metricValue(daySummary, 'Glucose')).toContainText('7.3');
  await expect(daySummary.getByText('4 U')).toBeVisible();
  await expect(daySummary.getByText('42 g')).toBeVisible();

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await page.getByLabel('Уровень глюкозы').fill('7,7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(metricValue(daySummary, 'Glucose')).toContainText('7.7');

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(metricValue(daySummary, 'Glucose')).toContainText('7.7');
});
