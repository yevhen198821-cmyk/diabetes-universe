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

test('dashboard uses Home navigation label without hardcoded user name', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { level: 1, name: 'Home', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Анна Иванова')).toHaveCount(0);
});

test('dashboard status-first hierarchy places last glucose before next action', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const sectionSummaries = await page
    .locator('#main-content > section')
    .evaluateAll((sections) =>
      sections.map((section, index) => ({
        index,
        text: section.textContent ?? '',
      })),
    );

  const lastGlucoseIndex = sectionSummaries.findIndex((section) =>
    section.text.includes('Last glucose'),
  );
  const nextActionIndex = sectionSummaries.findIndex((section) =>
    section.text.includes('Next action'),
  );

  expect(lastGlucoseIndex).toBeGreaterThanOrEqual(0);
  expect(nextActionIndex).toBeGreaterThan(lastGlucoseIndex);
});
