import { expect, test } from './support/test';

import { selectGlucoseUnitIfRequired } from './support/glucose-quick-add-helpers';
import { prepareEmptyTimelineDashboardFixture } from './support/timeline-indexeddb-helpers';

test('empty glucose hero CTA opens glucose Quick Add without creating an event', async ({
  page,
}) => {
  await page.goto('/');
  await prepareEmptyTimelineDashboardFixture(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });

  await lastGlucoseRegion.getByRole('button', { name: 'Add glucose' }).click();
  await selectGlucoseUnitIfRequired(page);
  await expect(page.getByLabel('Glucose level')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);
  await expect(
    lastGlucoseRegion.getByText('No measurements yet.'),
  ).toBeVisible();
  await expect(lastGlucoseRegion.getByText(/\d/)).toHaveCount(0);
});

test('empty glucose CTA remains accessible on mobile widths', async ({
  browser,
}) => {
  for (const viewport of [
    { height: 800, width: 360 },
    { height: 844, width: 390 },
    { height: 915, width: 412 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto('/');
    await prepareEmptyTimelineDashboardFixture(page);

    const button = page
      .getByRole('region', { name: 'Last glucose' })
      .getByRole('button', { name: 'Add glucose' });

    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);

    await context.close();
  }
});
