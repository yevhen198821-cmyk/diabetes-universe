import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const ENGLISH_HOME_CHROME = [
  'Good morning',
  'Good afternoon',
  'Good evening',
  'Good night',
  'Your data for today',
  'Last glucose',
  'Quick add',
  'Recent events',
  'All events',
  'Details',
] as const;

test('home renders Wave 1C visual foundation without fabricated identity data', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Diabetes Universe' }),
  ).toBeVisible();
  await expect(
    page.locator('img[src="/brand/diabetes-universe-logo.png"]'),
  ).toBeVisible();
  await expect(page.getByText('Diabetes', { exact: true })).toBeVisible();
  await expect(page.getByText('Universe', { exact: true })).toBeVisible();
  await expect(page.getByText('Anna')).toHaveCount(0);
  await expect(page.getByText('AI insight', { exact: false })).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quick add' })).toBeVisible();
  await expect(page.getByText('Next action')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Recent events' }),
  ).toBeVisible();
});

test('mobile navigation exposes real destinations without analytics placeholder', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await waitForApplicationReady(page);

  const navigation = page.getByRole('navigation');

  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(
    navigation.getByRole('link', { name: 'Timeline' }),
  ).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Analytics' })).toHaveCount(0);
  await expect(
    navigation.getByRole('button', { name: 'Add event' }),
  ).toHaveCount(0);
  await expect(navigation.getByRole('link')).toHaveCount(3);

  await navigation.getByRole('link', { name: 'Timeline' }).click();
  await expect(page).toHaveURL('/timeline');
});

test('quick add category buttons open existing quick add forms', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Quick add: Notes' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить заметку' }),
  ).toBeVisible();
});

test('today cards expose real-data mini chart summaries', async ({ page }) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('img', { name: /glucose readings today/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: /insulin dose today/i }),
  ).toBeVisible();
});

test('ru-RU Home chrome stays fully localized without English dashboard strings', async ({
  browser,
}) => {
  const context = await browser.newContext({
    locale: 'ru-RU',
    extraHTTPHeaders: {
      'Accept-Language': 'ru-RU',
    },
  });
  const page = await context.newPage();

  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'Последняя глюкоза' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Быстрое добавление' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Последние записи' }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Все записи', exact: true }),
  ).toBeVisible();

  for (const englishLabel of ENGLISH_HOME_CHROME) {
    await expect(page.getByText(englishLabel, { exact: true })).toHaveCount(0);
  }

  await expect(page.getByText('Breakfast', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Завтрак', { exact: true })).toBeVisible();

  await context.close();
});

test('mobile home layout stays compact at primary reference widths', async ({
  browser,
}) => {
  for (const viewport of [
    { height: 844, width: 390 },
    { height: 915, width: 412 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto('/');
    await waitForApplicationReady(page);

    await expect(
      page.locator('img[src="/brand/diabetes-universe-logo.png"]'),
    ).toBeVisible();
    await expect(page.getByText('Diabetes', { exact: true })).toBeVisible();
    await expect(page.getByText('Universe', { exact: true })).toBeVisible();

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);

    await expect(
      page.getByRole('heading', { name: 'Last glucose' }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Quick add' }),
    ).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();

    await context.close();
  }
});
