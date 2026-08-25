import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

async function openTimelineQuickAdd(page: import('@playwright/test').Page) {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
}

test('activity quick add creates timeline event with details flow', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openTimelineQuickAdd(page);
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
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Delete event?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.keyboard.press('Escape');
});

test('note quick add is searchable and appears in notes filter', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const noteText = 'E2E заметка для поиска';

  await openTimelineQuickAdd(page);
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить заметку' }),
  ).toBeVisible();

  await page.getByLabel('Текст заметки').fill(noteText);
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.getByLabel('Search events').fill('E2E заметка');
  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.getByRole('button', { name: 'Clear search' }).click();
  await page
    .getByRole('group', { name: 'Event filter' })
    .getByRole('button', { name: 'Notes', exact: true })
    .click();
  await expect(page.getByText(noteText).first()).toBeVisible();

  await page
    .getByRole('button', {
      name: new RegExp(`Open event: Note, ${noteText}`),
    })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Note' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await expect(page.getByText(noteText)).toHaveCount(0);
});

test('timeline quick add FAB hides while dialog is open on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openTimelineQuickAdd(page);
  await expect(page.locator('#timeline-mobile-quick-add-fab')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#timeline-mobile-quick-add-fab')).toBeVisible();
});
