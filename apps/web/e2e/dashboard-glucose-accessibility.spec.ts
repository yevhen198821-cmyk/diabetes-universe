import { expect, test } from './support/test';

import { selectGlucoseUnitIfRequired } from './support/glucose-quick-add-helpers';
import { prepareEmptyTimelineDashboardFixture } from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test('quick action glucose close returns focus to the same button', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const glucoseButton = page.getByRole('button', {
    name: 'Quick add: Glucose',
  });

  await glucoseButton.click();
  await expect(page.getByLabel('Glucose level')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);
  await expect(glucoseButton).toBeFocused();
});

test('quick action insulin close returns focus to the insulin button', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const insulinButton = page.getByRole('button', {
    name: 'Quick add: Insulin',
  });

  await insulinButton.click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('dialog', { name: 'Добавить инсулин' }),
  ).toHaveCount(0);
  await expect(insulinButton).toBeFocused();
});

test('empty Add glucose CTA cancel returns focus to the CTA', async ({
  page,
}) => {
  await page.goto('/');
  await prepareEmptyTimelineDashboardFixture(page);

  const cta = page
    .getByRole('region', { name: 'Last glucose' })
    .getByRole('button', { name: 'Add glucose' });

  await cta.click();
  await selectGlucoseUnitIfRequired(page);
  await expect(page.getByLabel('Glucose level')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);
  await expect(cta).toBeFocused();
});

test('empty Add glucose save moves focus to ready Last Glucose heading', async ({
  page,
}) => {
  await page.goto('/');
  await prepareEmptyTimelineDashboardFixture(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });
  const cta = lastGlucoseRegion.getByRole('button', { name: 'Add glucose' });

  await cta.click();
  await selectGlucoseUnitIfRequired(page);
  await page.getByLabel('Glucose level').fill('5.6');
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);
  await expect(cta).toHaveCount(0);
  await expect(lastGlucoseRegion.getByText('5.6')).toBeVisible();
  await expect(
    lastGlucoseRegion.getByRole('heading', { name: 'Last glucose' }),
  ).toBeFocused();
});

test('ready Last Glucose hero stays readable on mobile widths', async ({
  browser,
}) => {
  for (const viewport of [
    { height: 800, width: 360 },
    { height: 844, width: 390 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto('/');
    await waitForApplicationReady(page);

    const lastGlucoseRegion = page.getByRole('region', {
      name: 'Last glucose',
    });

    await expect(lastGlucoseRegion.getByText('7.3')).toBeVisible();
    await expect(
      lastGlucoseRegion.getByText('mmol/L', { exact: true }),
    ).toBeVisible();
    await expect(lastGlucoseRegion.locator('time')).toBeVisible();

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);

    await context.close();
  }
});
