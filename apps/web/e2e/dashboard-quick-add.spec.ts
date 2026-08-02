import { expect, test } from '@playwright/test';

test('dashboard quick add updates dashboard and timeline still works', async ({
  page,
}) => {
  await page.goto('/dashboard');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Последняя глюкоза' }),
  ).toBeVisible();
  const daySummary = page.getByRole('region', { name: 'Сводка дня' });

  await expect(daySummary.getByText('4 ЕД')).toBeVisible();

  await page
    .getByRole('button', { name: 'Добавить событие' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();

  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('5');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toBeHidden();
  await expect(daySummary.getByText('9 ЕД')).toBeVisible();

  await page.getByRole('link', { name: 'Все события' }).click();

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(page.getByText('6,4 ммоль/л').first()).toBeVisible();

  await page
    .getByRole('button', { name: 'Добавить событие' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
});
