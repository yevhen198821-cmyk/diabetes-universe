import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('timeline note persists across page reload', async ({ page }) => {
  const noteText = 'E2E reload persistence marker';

  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Добавить событие' }).click();
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить заметку' }),
  ).toBeVisible();

  await page.getByLabel('Текст заметки').fill(noteText);
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.reload();
  await waitForApplicationReady(page);

  await expect(page.getByText(noteText).first()).toBeVisible();
});

test('dashboard quick add insulin persists across page reload', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    page.getByRole('region', { name: 'Day summary' }).getByText('11 U'),
  ).toBeVisible();

  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Day summary' }).getByText('11 U'),
  ).toBeVisible();
});
