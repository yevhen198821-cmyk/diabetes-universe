import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard quick add updates shared timeline state', async ({ page }) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(page).toHaveTitle(/Dashboard \| Diabetes Universe/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Last glucose' }),
  ).toBeVisible();
  const daySummary = page.getByRole('region', { name: 'Day summary' });

  await expect(daySummary.getByText('4 U')).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
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
  await expect(daySummary.getByText('9 U')).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();

  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '30 July' })).toBeVisible();
  await expect(
    page.getByRole('group', { name: 'Фильтр событий' }),
  ).toBeVisible();
  await expect(page.getByText('6.4 mmol/L').first()).toBeVisible();
  await expect(page.getByText('5 U').first()).toBeVisible();

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

  const daySummary = page.getByRole('region', { name: 'Day summary' });

  await expect(page.getByText('Next action')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Add insulin' }),
  ).toBeVisible();
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
  await expect(daySummary.getByText('6 U')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Add', exact: true }),
  ).toBeFocused();

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await expect(page.getByText('2 U').first()).toBeVisible();
});

test('timeline groups demo events and avoids mobile horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Yesterday' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '30 July' })).toBeVisible();

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
  await page.getByRole('button', { name: 'Insulin' }).click();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();
  await expect(page.getByText('Метформин').first()).toBeHidden();

  await search.fill('Метформин');
  await expect(
    page.getByRole('heading', { name: 'Ничего не найдено' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Сбросить фильтры' }).first().click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Метформин').first()).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();

  await page.goto('/timeline');
  await waitForApplicationReady(page);
  const homeLink = page.getByRole('link', { name: 'На главную' });
  await homeLink.focus();
  await expect(homeLink).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(search).toBeFocused();
  await page.keyboard.type('glucose');
  await expect(search).toHaveValue('glucose');
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');
});

test('timeline quick add updates shared dashboard state', async ({ page }) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

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

  await expect(page.getByText('8.8 mmol/L').first()).toBeVisible();

  await page.getByRole('link', { name: 'На главную' }).click();

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('8.8 mmol/L'),
  ).toBeVisible();
});

test('/dashboard redirects to home dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await waitForApplicationReady(page);

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
});
