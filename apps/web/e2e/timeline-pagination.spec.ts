import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const eventCards = (page: Page) =>
  page.getByRole('button', { name: /Open event/ });

test('timeline load more reveals the next page and then disappears', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(eventCards(page)).toHaveCount(20);
  await expect(page.getByText('Remaining: 11')).toBeVisible();

  await page.getByRole('button', { name: 'Load more' }).click();

  await expect(eventCards(page)).toHaveCount(31);
  await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden();
});

test('timeline search paginates all matching results', async ({ page }) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByLabel('Search events').fill('История');

  await expect(page.getByText('24 events')).toBeVisible();
  await expect(eventCards(page)).toHaveCount(20);

  await page.getByRole('button', { name: 'Load more' }).click();

  await expect(eventCards(page)).toHaveCount(24);
  await expect(page.getByRole('button', { name: 'Load more' })).toBeHidden();
});

test('timeline filter pagination resets visible count with criteria reset', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Notes' }).click();

  await expect(page.getByText('25 events')).toBeVisible();
  await expect(eventCards(page)).toHaveCount(20);

  await page.getByRole('button', { name: 'Load more' }).click();
  await expect(eventCards(page)).toHaveCount(25);

  await page.getByRole('button', { name: 'Clear filters' }).click();

  await expect(page.getByText('31 events')).toBeVisible();
  await expect(eventCards(page)).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Load more' })).toBeVisible();
});

test('timeline pagination recalculates after delete and keeps new add on top', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: /Open event: NovoRapid/ }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await expect(page.getByText('Remaining: 10')).toBeVisible();
  await expect(eventCards(page)).toHaveCount(20);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
    .click();
  await page.getByLabel('Уровень глюкозы').fill('8,8');
  await page.getByRole('button', { name: /Время/ }).click();
  const timePicker = page.getByRole('dialog', { name: 'Выберите время' });

  await timePicker.getByRole('button', { name: '23' }).first().click();
  await timePicker.getByRole('button', { name: '59' }).last().click();
  await timePicker.getByRole('button', { name: 'Готово' }).click();
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(eventCards(page).first()).toContainText('8.8 mmol/L');
  await expect(page.getByText('Remaining: 11')).toBeVisible();
});

test('timeline load more is usable on mobile without FAB overlap or horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const loadMore = page.getByRole('button', { name: 'Load more' });

  await expect(loadMore).toBeVisible();
  await loadMore.scrollIntoViewIfNeeded();

  const loadMoreBox = await loadMore.boundingBox();
  const fabBox = await page
    .getByRole('button', { name: 'Add event' })
    .boundingBox();

  expect(loadMoreBox).not.toBeNull();
  expect(fabBox).not.toBeNull();

  const overlaps =
    loadMoreBox !== null &&
    fabBox !== null &&
    loadMoreBox.x < fabBox.x + fabBox.width &&
    loadMoreBox.x + loadMoreBox.width > fabBox.x &&
    loadMoreBox.y < fabBox.y + fabBox.height &&
    loadMoreBox.y + loadMoreBox.height > fabBox.y;

  expect(overlaps).toBe(false);

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});
