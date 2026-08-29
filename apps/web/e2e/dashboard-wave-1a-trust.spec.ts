import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('dashboard does not render mock AI insight block', async ({ page }) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'AI insight', exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText('Automatic explanation')).toHaveCount(0);
  await expect(
    page.getByText(
      'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
    ),
  ).toHaveCount(0);
});

test('dashboard uses brand and Home navigation without hardcoded user name', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Diabetes Universe',
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(page.getByText('Анна Иванова')).toHaveCount(0);
});

test('dashboard status-first hierarchy places last glucose before today summary', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByText('Next action')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible();

  const sectionSummaries = await page
    .locator('#main-content > section')
    .evaluateAll((sections) =>
      sections.map((section, index) => ({
        hasLastGlucoseHeading: section.querySelector('#dashboard-last-glucose-title') !== null,
        hasTodayHeading: section.querySelector('#dashboard-day-summary-title') !== null,
        index,
      })),
    );

  const lastGlucoseIndex = sectionSummaries.findIndex(
    (section) => section.hasLastGlucoseHeading,
  );
  const todayIndex = sectionSummaries.findIndex((section) => section.hasTodayHeading);

  expect(lastGlucoseIndex).toBeGreaterThanOrEqual(0);
  expect(todayIndex).toBeGreaterThan(lastGlucoseIndex);
});
