import { expect, test } from './support/test';

import { selectGlucoseUnitIfRequired } from './support/glucose-quick-add-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test('Today glucose card shows measurement count without duplicating Last Glucose hero', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });
  const todayRegion = page.getByRole('region', { name: 'Today' });

  await expect(lastGlucoseRegion.getByText('7.3')).toBeVisible();
  await expect(todayRegion.getByText('2 measurements')).toBeVisible();
  await expect(todayRegion.getByText('7.3')).toHaveCount(0);

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await selectGlucoseUnitIfRequired(page);
  await page.getByLabel('Glucose level').fill('5.6');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);

  await expect(lastGlucoseRegion.getByText('5.6')).toBeVisible();
  await expect(todayRegion.getByText('3 measurements')).toBeVisible();
  await expect(todayRegion.getByText('5.6')).toHaveCount(0);
});
