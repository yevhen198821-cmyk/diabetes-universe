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
  await expect(page.getByText('Last measurement')).toBeVisible();
  await expect(page.getByText('Последняя глюкоза')).toHaveCount(0);
  await expect(lastGlucoseRegion.getByText('7,3 ммоль/л')).toBeVisible();
  await expect(lastGlucoseRegion.locator('time')).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
    .click();
  await page.getByLabel('Уровень глюкозы').fill('7,7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(lastGlucoseRegion.getByText('7,7 ммоль/л')).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Открыть событие: Глюкоза, 7,7 ммоль\/л/ })
    .click();
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByLabel('Значение').fill('8.2');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await page.getByRole('button', { exact: true, name: 'Закрыть' }).click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('8,2 ммоль/л'),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await page
    .getByRole('button', { name: /Открыть событие: Глюкоза, 8,2 ммоль\/л/ })
    .click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await page
    .getByRole('dialog', { name: 'Удалить событие?' })
    .getByRole('button', { name: 'Удалить' })
    .click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('7,3 ммоль/л'),
  ).toBeVisible();
});
