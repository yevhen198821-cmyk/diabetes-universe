import { expect, test } from '@playwright/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard next action renders localized English copy and opens insulin quick add', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(page.getByText('Next action')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Add insulin' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Следующее действие')).toHaveCount(0);

  const daySummary = page.getByRole('region', { name: 'Сводка дня' });

  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toBeVisible();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('2');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toBeHidden();
  await expect(daySummary.getByText('6 ЕД')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add', exact: true }),
  ).toBeFocused();

  await page.getByRole('link', { name: 'Все события' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);
  await expect(page.getByText('2 ЕД').first()).toBeVisible();
});
