import { expect, type Locator, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function metricValue(region: Locator, label: string): Locator {
  return region.locator(`dt:has-text("${label}") + dd`);
}

test('dashboard day summary renders English labels and syncs with timeline edits', async ({
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
  await expect(page.getByText('Reminders')).toBeVisible();
  await expect(page.getByText('Сводка дня')).toHaveCount(0);
  await expect(daySummary.locator('time')).toBeVisible();
  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('2');
  await expect(daySummary.getByText('4 U')).toBeVisible();
  await expect(daySummary.getByText('42 g')).toBeVisible();
  await expect(metricValue(daySummary, 'Medication doses')).toHaveText('1');
  await expect(metricValue(daySummary, 'Reminders')).toHaveText('1 / 3');

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
    .click();
  await page.getByLabel('Уровень глюкозы').fill('7,7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('3');

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('2');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(daySummary.getByText('6 U')).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Питание. Записать приём пищи' })
    .click();
  await page.getByRole('button', { name: /Тип приёма пищи/ }).click();
  await page.getByRole('button', { name: 'Завтрак' }).click();
  await page.getByLabel('Углеводы').fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(daySummary.getByText('52 g')).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Лекарство. Записать приём препарата' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'Jardiance' }).click();
  await page.getByRole('textbox', { name: 'Доза' }).fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(metricValue(daySummary, 'Medication doses')).toHaveText('2');

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: Glucose, 7\.7 mmol\/L/ })
    .click();
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByLabel('Значение').fill('8.2');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await page.getByRole('button', { exact: true, name: 'Закрыть' }).click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('3');

  await page.getByRole('link', { name: 'All events' }).click();
  await page
    .getByRole('button', { name: /Open event: NovoRapid, 2 U/ })
    .click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await page
    .getByRole('dialog', { name: 'Удалить событие?' })
    .getByRole('button', { name: 'Удалить' })
    .click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(daySummary.getByText('4 U')).toBeVisible();
  await expect(metricValue(daySummary, 'Glucose measurements')).toHaveText('3');
});
