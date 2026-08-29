import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';
import {
  selectGlucoseUnitIfRequired,
  setGlucoseQuickAddTime,
} from './support/glucose-quick-add-helpers';

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
  const daySummary = page.getByRole('region', { name: 'Today' });

  await expect(daySummary.getByText('4 U')).toBeVisible();

  for (const category of [
    'Glucose',
    'Insulin',
    'Nutrition',
    'Activity',
    'Notes',
  ]) {
    await expect(
      page.getByRole('button', { name: `Quick add: ${category}` }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
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
  await expect(
    page.getByRole('heading', { name: 'Events of the day', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Day navigation' }),
  ).toBeVisible();
  await expect(page.getByRole('group', { name: 'Event filter' })).toBeVisible();
  await expect(page.getByText('6.4 mmol/L').first()).toBeVisible();
  await expect(page.getByText('5 U').first()).toBeVisible();

  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить событие' }),
  ).toBeVisible();
});

test('quick add insulin opens directly and updates dashboard', async ({
  page,
}) => {
  await page.goto('/');

  await waitForApplicationReady(page);

  const daySummary = page.getByRole('region', { name: 'Today' });

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();

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

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await expect(page.getByText('2 U').first()).toBeVisible();
});

test('timeline groups demo events by day period and avoids mobile horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Timeline' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Events of the day', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('navigation', { name: 'Day navigation' }),
  ).toBeVisible();

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

  const search = page.getByLabel('Search events');

  await search.fill('Метформин');
  await expect(page.getByText('Метформин').first()).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeHidden();

  await page.getByRole('button', { name: 'Clear search' }).click();
  await expect(search).toHaveValue('');
  await page.getByRole('button', { name: 'Insulin' }).click();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();
  await expect(page.getByText('Метформин').first()).toBeHidden();

  await search.fill('Метформин');
  await expect(
    page.getByRole('heading', { name: 'No matching events' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).first().click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: 'All' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('Метформин').first()).toBeVisible();
  await expect(page.getByText('NovoRapid').first()).toBeVisible();

  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await search.focus();
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

  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
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

  await selectGlucoseUnitIfRequired(page);
  await page.getByLabel('Glucose level').fill('8.8');
  await setGlucoseQuickAddTime(page, '11', '30');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText('8.8 mmol/L').first()).toBeVisible();

  await page.getByRole('link', { name: 'Go to home' }).click();

  await expect(page).toHaveURL('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('8.8', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('mmol/L', {
      exact: true,
    }),
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
