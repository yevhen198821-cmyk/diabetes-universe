import { expect, test } from '@playwright/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard quick add updates shared timeline state', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Dashboard \| Diabetes Universe/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Последняя глюкоза' }),
  ).toBeVisible();
  const daySummary = page.getByRole('region', { name: 'Сводка дня' });

  await expect(daySummary.getByText('4 ЕД')).toBeVisible();

  await page.getByRole('button', { name: 'Добавить событие' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();

  const quickAddDialog = page.getByRole('dialog', { name: 'Добавить событие' });
  await expect(
    quickAddDialog.getByRole('button', { name: /Глюкоза/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Инсулин/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Питание/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Лекарство/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Активность/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Заметка/ }),
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

  await expect(page).toHaveURL('/timeline');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Вчера' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '30 июля' })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Фильтр событий' }),
  ).toBeVisible();
  await expect(page.getByText('6,4 ммоль/л').first()).toBeVisible();
  await expect(page.getByText('5 ЕД').first()).toBeVisible();

  await page.getByRole('button', { name: 'Добавить событие' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
});

test('next action opens insulin quick add directly and updates dashboard', async ({
  page,
}) => {
  await page.goto('/');

  await waitForApplicationReady(page);

  const daySummary = page.getByRole('region', { name: 'Сводка дня' });

  await expect(page.getByText('Следующее действие')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Добавить инсулин' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Добавить', exact: true }).click();

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
    page.getByRole('button', { name: 'Добавить', exact: true }),
  ).toBeFocused();

  await page.getByRole('link', { name: 'Все события' }).click();
  await expect(page).toHaveURL('/timeline');
  await expect(page.getByText('2 ЕД').first()).toBeVisible();
});

test('timeline groups demo events and avoids mobile horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');

  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Вчера' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '30 июля' })).toBeVisible();

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});

test('timeline search and filters combine without changing store', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const search = page.getByLabel('Поиск событий');

  await search.fill('Метформин');
  await expect(page.getByText('Метформин').first()).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeHidden();

  await page.getByRole('button', { name: 'Очистить поиск' }).click();
  await expect(search).toHaveValue('');
  await page.getByRole('button', { name: 'Инсулин' }).click();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();
  await expect(page.getByText('Метформин').first()).toBeHidden();

  await search.fill('Метформин');
  await expect(
    page.getByRole('heading', { name: 'Ничего не найдено' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить фильтры' }).first().click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Все' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Метформин').first()).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();

  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(search).toBeFocused();
  await page.keyboard.type('глюкоза');
  await expect(search).toHaveValue('глюкоза');
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
});

test('timeline quick add updates shared dashboard state', async ({ page }) => {
  await page.goto('/timeline');

  await expect(page).toHaveTitle(/Timeline \| Diabetes Universe/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Добавить событие' }).click();
  const quickAddDialog = page.getByRole('dialog', { name: 'Добавить событие' });
  await expect(
    quickAddDialog.getByRole('button', { name: /Активность/ }),
  ).toBeVisible();
  await expect(
    quickAddDialog.getByRole('button', { name: /Заметка/ }),
  ).toBeVisible();
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

  await expect(page.getByText('8,8 ммоль/л').first()).toBeVisible();

  await page.getByRole('link', { name: 'На главную' }).click();

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('region', { name: 'Последняя глюкоза' })
      .getByText('8,8 ммоль/л'),
  ).toBeVisible();
});

test('/dashboard redirects to home dashboard', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
});
