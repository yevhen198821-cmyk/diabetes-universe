import { expect, type Locator, type Page, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function recentEventsSection(page: Page): Locator {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'Recent events', exact: true }),
  });
}

test('dashboard recent events renders English chrome and syncs with timeline edits', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const recentEvents = recentEventsSection(page);

  await expect(
    page.getByRole('heading', { name: 'Recent events', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'All events', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Недавние события')).toHaveCount(0);

  await expect(recentEvents.getByText('Medication')).toBeVisible();
  await expect(recentEvents.getByText('Nutrition')).toBeVisible();
  await expect(recentEvents.getByText('Insulin')).toBeVisible();
  await expect(recentEvents.getByText('Activity')).toBeVisible();

  await expect(
    recentEvents.getByText('Метформин', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('Завтрак', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('NovoRapid', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('Прогулка', { exact: true }),
  ).toBeVisible();

  await expect(recentEvents.locator('time')).toHaveCount(4);
  for (const timeElement of await recentEvents.locator('time').all()) {
    await expect(timeElement).toHaveText(/\d{1,2}:\d{2}/);
  }

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('5');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(recentEvents.getByText('5 ЕД', { exact: true })).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(3);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Питание. Записать приём пищи' })
    .click();
  await page.getByRole('button', { name: /Тип приёма пищи/ }).click();
  await page.getByRole('button', { name: 'Завтрак' }).click();
  await page.getByLabel('Углеводы').fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    recentEvents.getByText('10 г углеводов', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Лекарство. Записать приём препарата' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'Jardiance' }).click();
  await page.getByRole('textbox', { name: 'Доза' }).fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    recentEvents.getByText('Jardiance', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Активность. Записать тренировку' })
    .click();
  await page.getByRole('button', { name: /Вид активности/ }).click();
  await page.getByRole('button', { name: 'Ходьба' }).click();
  await page.getByLabel('Продолжительность, мин').fill('45');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(recentEvents.getByText('Ходьба', { exact: true })).toBeVisible();
  await expect(recentEvents.getByText('45 мин', { exact: true })).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(4);

  await page.getByRole('link', { name: 'All events', exact: true }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Открыть событие: NovoRapid, 5 ЕД/ })
    .click();
  await page.getByRole('button', { name: 'Изменить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Изменить событие' }),
  ).toBeVisible();
  await page.getByLabel('Значение').fill('6');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await page.getByRole('button', { exact: true, name: 'Закрыть' }).click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(recentEvents.getByText('6 ЕД', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'All events', exact: true }).click();
  await page
    .getByRole('button', { name: /Открыть событие: NovoRapid, 6 ЕД/ })
    .click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await page
    .getByRole('dialog', { name: 'Удалить событие?' })
    .getByRole('button', { name: 'Удалить' })
    .click();

  await page.getByRole('link', { name: 'На главную' }).click();
  await waitForApplicationReady(page);

  await expect(recentEvents.getByText('6 ЕД', { exact: true })).toHaveCount(0);
  await expect(recentEvents.getByText('Ходьба', { exact: true })).toBeVisible();
  await expect(
    recentEvents.getByText('Jardiance', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('10 г углеводов', { exact: true }),
  ).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(3);
});
