import { expect, type Locator, type Page, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

function aiInsightSection(page: Page): Locator {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: 'AI insight', exact: true }),
  });
}

test('dashboard ai insight renders English chrome with pass-through domain content', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const aiInsight = aiInsightSection(page);

  await expect(
    page.getByRole('heading', { name: 'AI insight', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('ИИ-объяснение')).toHaveCount(0);
  await expect(aiInsight.getByText('Automatic explanation')).toBeVisible();
  await expect(
    aiInsight.getByText('Not a diagnosis or treatment prescription.'),
  ).toBeVisible();
  await expect(
    aiInsight.getByText('После завтрака', { exact: true }),
  ).toHaveCount(2);
  await expect(
    aiInsight.getByText(
      'После завтрака значение глюкозы было выше обычного уровня по вашим записям.',
    ),
  ).toBeVisible();
  await expect(aiInsight.getByText('Related records: 2')).toBeVisible();

  const timeElement = aiInsight.locator('time');
  await expect(timeElement).toHaveCount(1);
  await expect(timeElement).toHaveText(/\d{1,2}:\d{2}/);
});

test('dashboard ai insight remains visible across mobile tablet and desktop viewports', async ({
  page,
}) => {
  const viewports = [
    { height: 844, width: 390 },
    { height: 1024, width: 768 },
    { height: 800, width: 1280 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForApplicationReady(page);

    const aiInsight = aiInsightSection(page);

    await expect(
      aiInsight.getByRole('heading', { name: 'AI insight', exact: true }),
    ).toBeVisible();
    await expect(
      aiInsight.getByText('После завтрака', { exact: true }),
    ).toHaveCount(2);

    await aiInsight.scrollIntoViewIfNeeded();

    const box = await aiInsight.boundingBox();
    assertNoHorizontalClipping(box, viewport.width);
  }
});

function assertNoHorizontalClipping(
  box: { height: number; width: number; x: number; y: number } | null,
  viewportWidth: number,
) {
  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewportWidth + 1);
}
