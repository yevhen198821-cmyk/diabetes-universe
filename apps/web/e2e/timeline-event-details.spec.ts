import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const openEvent = async (page: Page, name: RegExp | string) => {
  const card = page.getByRole('button', { name }).first();

  await card.click();

  return card;
};

test('timeline event details open, close with Escape, and return focus', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const card = await openEvent(page, /Open event: Метформин/);

  await expect(page.getByRole('dialog', { name: 'Метформин' })).toBeVisible();
  await expect(page.getByText('Лекарство')).toBeVisible();
  await expect(page.getByText('400 мг').first()).toBeVisible();
  await expect(page.getByText('Демо-данные')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Метформин' })).toBeHidden();
  await expect(card).toBeFocused();
});

test('timeline event edit updates Timeline and Dashboard selectors', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Glucose, 7\.3 mmol\/L/);
  await page.getByRole('button', { name: 'Изменить' }).click();

  await expect(
    page.getByRole('dialog', { name: 'Изменить событие' }),
  ).toBeVisible();
  await page.getByLabel('Значение').fill('9.1');
  await page.getByLabel('Время').fill('23:58');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('9.1 mmol/L').first()).toBeVisible();

  await page.getByRole('button', { exact: true, name: 'Закрыть' }).click();
  await page.getByRole('link', { name: 'На главную' }).click();

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('9.1 mmol/L'),
  ).toBeVisible();
  await expect(page.getByText('9.1 mmol/L').first()).toBeVisible();
});

test('timeline edit moves an event between Today and Yesterday groups', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Breakfast/);
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByLabel('Дата').fill('2026-08-01');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await page.getByRole('button', { exact: true, name: 'Закрыть' }).click();

  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
  await expect(page.getByText('Breakfast').first()).toBeVisible();
});

test('timeline event delete requires confirmation and updates Dashboard', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: NovoRapid/);
  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Удалить событие?' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Удалить событие?' }),
  ).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'NovoRapid' })).toBeVisible();

  await page.getByRole('button', { name: 'Удалить' }).click();
  await page
    .getByRole('dialog', { name: 'Удалить событие?' })
    .getByRole('button', { name: 'Удалить' })
    .click();
  await expect(page.getByText('NovoRapid').first()).toBeHidden();

  await page.getByRole('link', { name: 'На главную' }).click();
  await expect(
    page.getByRole('region', { name: 'Day summary' }).getByText('0 U'),
  ).toBeVisible();
});

test('timeline closes details when edited event leaves search results', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const search = page.getByLabel('Поиск событий');

  await search.fill('Метформин');
  await openEvent(page, /Open event: Метформин/);
  await page.getByRole('button', { name: 'Изменить' }).click();
  await page.getByLabel('Название').fill('Сиофор');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    page.getByRole('heading', { name: 'Ничего не найдено' }),
  ).toBeVisible();
  await expect(search).toBeFocused();
});

test('timeline event details work on mobile without horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Метформин/);

  const dialog = page.getByRole('dialog', { name: 'Метформин' });
  const box = await dialog.boundingBox();

  expect(box?.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Изменить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Изменить событие' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Удалить событие?' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});
