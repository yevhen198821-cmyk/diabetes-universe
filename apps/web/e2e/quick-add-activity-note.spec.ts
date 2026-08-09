import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const openQuickAdd = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Добавить событие' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
};

test('activity quick add creates timeline event with details flow', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openQuickAdd(page);
  await page
    .getByRole('button', { name: 'Активность. Записать тренировку' })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить активность' }),
  ).toBeVisible();

  await page.getByRole('button', { name: /Вид активности/ }).click();
  await page.getByRole('button', { name: 'Ходьба' }).click();
  await page.getByLabel('Продолжительность, мин').fill('30');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('30 min').first()).toBeVisible();
  await expect(page.getByText('Ходьба').first()).toBeVisible();

  await page
    .getByRole('button', { name: /Open event: Ходьба, 30 min/ })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Ходьба' })).toBeVisible();
  await page.getByRole('button', { name: 'Изменить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Изменить событие' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Удалить событие?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await page.keyboard.press('Escape');
});

test('note quick add is searchable and appears in notes filter', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const noteText = 'E2E заметка для поиска';

  await openQuickAdd(page);
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить заметку' }),
  ).toBeVisible();

  await page.getByLabel('Текст заметки').fill(noteText);
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.getByLabel('Поиск событий').fill('E2E заметка');
  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.getByRole('button', { name: 'Очистить поиск' }).click();
  await page.getByRole('button', { name: 'Заметки' }).click();
  await expect(page.getByText(noteText).first()).toBeVisible();

  await page
    .getByRole('button', {
      name: new RegExp(`Open event: Заметка, ${noteText}`),
    })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Заметка' })).toBeVisible();
});

test('quick add shows six categories on mobile without horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openQuickAdd(page);
  const quickAddDialog = page.getByRole('dialog', { name: 'Добавить событие' });

  for (const label of [
    'Глюкоза',
    'Инсулин',
    'Питание',
    'Лекарство',
    'Активность',
    'Заметка',
  ]) {
    await expect(
      quickAddDialog.getByRole('button', { name: new RegExp(label) }),
    ).toBeVisible();
  }

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );
  expect(hasHorizontalScroll).toBe(false);

  await expect(
    page.getByRole('button', { name: 'Добавить событие' }),
  ).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Добавить событие' }),
  ).toBeVisible();
});
