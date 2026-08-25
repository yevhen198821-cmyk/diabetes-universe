import { type Browser } from '@playwright/test';

import { expect, test } from './support/test';

import { CANONICAL_DEMO_LOCAL_DAY_TIME } from '../testing/demo-reference-time';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function openTimeline(
  page: import('./support/test').Page,
  headingName: string | RegExp,
) {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: headingName }),
  ).toBeVisible();
}

async function createLocalizedPage(
  browser: Browser,
  locale: string,
  options?: { viewport?: { height: number; width: number } },
) {
  const context = await browser.newContext({
    locale,
    extraHTTPHeaders: { 'Accept-Language': locale },
    viewport: options?.viewport,
  });
  const page = await context.newPage();
  await page.clock.install({ time: CANONICAL_DEMO_LOCAL_DAY_TIME });

  return { context, page };
}

test('timeline EN chrome has no unintended Russian strings', async ({
  page,
}) => {
  await openTimeline(page, 'Timeline');

  await expect(
    page.getByRole('heading', { name: 'Events of the day', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Tap an event to view details.')).toBeVisible();
  await expect(page.getByLabel('Search events')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Night' })).toBeVisible();
  await expect(page.getByText('События за день')).toHaveCount(0);
  await expect(page.getByText('Поиск событий')).toHaveCount(0);
});

test('timeline RU chrome stays fully localized without English chrome', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'ru-RU');

  await openTimeline(page, 'Таймлайн');

  await expect(
    page.getByRole('heading', { name: 'События за день', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Нажмите на событие, чтобы посмотреть подробности.'),
  ).toBeVisible();
  await expect(page.getByLabel('Поиск событий')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ночь' })).toBeVisible();
  await expect(page.getByText('Events of the day')).toHaveCount(0);
  await expect(page.getByText('Search events')).toHaveCount(0);

  await context.close();
});

test('timeline UK uses Ukrainian labels', async ({ browser }) => {
  const { context, page } = await createLocalizedPage(browser, 'uk-UA');

  await openTimeline(page, 'Хронологія');

  await expect(
    page.getByRole('heading', { name: 'Події дня', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Натисніть на подію, щоб переглянути деталі.'),
  ).toBeVisible();
  await expect(page.getByLabel('Пошук подій')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ніч' })).toBeVisible();

  await context.close();
});

test('timeline DE uses German labels', async ({ browser }) => {
  const { context, page } = await createLocalizedPage(browser, 'de-DE');

  await openTimeline(page, 'Zeitachse');

  await expect(
    page.getByRole('heading', { name: 'Ereignisse des Tages', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Tippen Sie auf ein Ereignis, um Details anzuzeigen.'),
  ).toBeVisible();
  await expect(page.getByLabel('Ereignisse suchen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Nacht' })).toBeVisible();

  await context.close();
});

test('timeline toolbar and day navigation pluralization stay localized', async ({
  page,
}) => {
  await openTimeline(page, 'Timeline');

  await expect(
    page
      .getByLabel('Timeline search and filters')
      .getByText('31 events', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('1 events', { exact: true })).toHaveCount(0);
  await page.getByLabel('Search events').fill('NovoRapid');
  await expect(
    page
      .getByLabel('Timeline search and filters')
      .getByText('1 event', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Today, 2 August/i)).toBeVisible();
});

test('timeline RU exposes localized aria labels for navigation and FAB', async ({
  browser,
}) => {
  const { context, page } = await createLocalizedPage(browser, 'ru-RU', {
    viewport: { height: 844, width: 390 },
  });

  await openTimeline(page, 'Таймлайн');

  await expect(
    page.getByRole('button', { name: 'Предыдущий день' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Следующий день' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Добавить событие' }),
  ).toBeVisible();
  await expect(
    page
      .getByLabel('Поиск и фильтры таймлайна')
      .getByText('31 событие', { exact: true }),
  ).toBeVisible();

  await context.close();
});
