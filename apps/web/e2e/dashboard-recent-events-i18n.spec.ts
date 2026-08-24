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
    recentEvents.getByText('Breakfast', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('NovoRapid', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('Прогулка', { exact: true }),
  ).toBeVisible();

  await expect(recentEvents.locator('time')).toHaveCount(4);
  await expect(
    recentEvents.getByText('Yesterday,', { exact: false }),
  ).toBeVisible();
  for (const timeElement of await recentEvents.locator('time').all()) {
    await expect(timeElement).toHaveText(
      /(\d{1,2}:\d{2}|Yesterday, \d{1,2}:\d{2})/,
    );
  }

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('5');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(recentEvents.getByText('5 U', { exact: true })).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(4);

  await page.getByRole('button', { name: 'Quick add: Nutrition' }).click();
  await page.getByRole('button', { name: /Тип приёма пищи/ }).click();
  await page.getByRole('button', { name: 'Завтрак' }).click();
  await page.getByLabel('Углеводы').fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    recentEvents.getByText('10 g carbs', { exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events', exact: true }).click();
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Лекарство. Записать приём препарата' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'Jardiance' }).click();
  await page.getByRole('textbox', { name: 'Доза' }).fill('10');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(
    recentEvents.getByText('Jardiance', { exact: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Quick add: Activity' }).click();
  await page.getByRole('button', { name: /Вид активности/ }).click();
  await page.getByRole('button', { name: 'Ходьба' }).click();
  await page.getByLabel('Продолжительность, мин').fill('45');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(recentEvents.getByText('Ходьба', { exact: true })).toBeVisible();
  await expect(recentEvents.getByText('45 min', { exact: true })).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(4);

  await page.getByRole('link', { name: 'All events', exact: true }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: NovoRapid, 5 U/ })
    .click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  await page.getByLabel('Value').fill('6');
  await page.getByRole('button', { name: 'Save' }).click();
  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(recentEvents.getByText('6 U', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'All events', exact: true }).click();
  await page
    .getByRole('button', { name: /Open event: NovoRapid, 6 U/ })
    .click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(recentEvents.getByText('6 U', { exact: true })).toHaveCount(0);
  await expect(recentEvents.getByText('Ходьба', { exact: true })).toBeVisible();
  await expect(
    recentEvents.getByText('Jardiance', { exact: true }),
  ).toBeVisible();
  await expect(
    recentEvents.getByText('10 g carbs', { exact: true }),
  ).toBeVisible();
  await expect(recentEvents.locator('li')).toHaveCount(4);
});
