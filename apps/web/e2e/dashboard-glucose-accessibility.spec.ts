import { expect, test, type Locator, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { selectGlucoseUnitIfRequired } from './support/glucose-quick-add-helpers';
import { prepareEmptyTimelineDashboardFixture } from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function configureTargetRangeForDashboard(page: Page) {
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  const mmolButton = page.getByRole('button', { name: 'mmol/L', exact: true });
  if ((await mmolButton.getAttribute('aria-pressed')) !== 'true') {
    const patchPromise = page.waitForResponse(
      (response) =>
        response.url().includes('/api/v1/medical/me/diabetes-settings') &&
        response.request().method() === 'PATCH',
    );
    await mmolButton.click();
    expect((await patchPromise).ok()).toBeTruthy();
  }

  const targetTrigger = page.getByRole('button', { name: /^Target range /i });
  await targetTrigger.click();
  const targetDialog = page.getByRole('dialog', { name: 'Target range' });
  await expect(targetDialog).toBeVisible();

  const lowerInput = targetDialog.getByLabel('Lower limit');
  const upperInput = targetDialog.getByLabel('Upper limit');
  await lowerInput.fill('4.0');
  await upperInput.fill('10.0');

  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/medical/me/glucose-target-profile') &&
      response.request().method() === 'PUT',
  );
  await targetDialog.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await putPromise).ok()).toBeTruthy();
  await expect(targetDialog).toBeHidden();
}

async function assertReadyHeroMobileContract(region: Locator) {
  await expect(region.getByText('7.3')).toBeVisible();
  await expect(region.getByText('mmol/L', { exact: true })).toBeVisible();
  await expect(region.getByText('In your range')).toBeVisible();

  const time = region.locator('time');
  await expect(time).toBeVisible();
  await expect(time).not.toHaveText('');

  await expect(
    region.getByText(/Fresh data|Measurement is outdated/),
  ).toBeVisible();
}

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

test('ready Last Glucose hero exposes full mobile contract at 360 and 390', async ({
  browser,
  request,
}) => {
  for (const viewport of [
    { height: 800, width: 360 },
    { height: 844, width: 390 },
  ]) {
    const context = await browser.newContext({
      extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
      locale: 'en-GB',
      viewport,
    });
    const page = await context.newPage();

    await signInWithMagicLink(
      page,
      request,
      `mobile-hero-${viewport.width}@example.com`,
    );
    await configureTargetRangeForDashboard(page);
    await page.goto('/');
    await waitForApplicationReady(page);

    const lastGlucoseRegion = page.getByRole('region', {
      name: 'Last glucose',
    });

    await assertReadyHeroMobileContract(lastGlucoseRegion);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
    await selectGlucoseUnitIfRequired(page);
    await page.getByLabel('Glucose level').fill('8.1');
    await page.getByRole('button', { name: 'Сохранить' }).click();
    await expect(page.getByLabel('Glucose level')).toHaveCount(0);
    await expect(lastGlucoseRegion.getByText('8.1')).toBeVisible();
    await expect(lastGlucoseRegion.getByText('Manual entry')).toBeVisible();

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);

    await context.close();
  }
});
