import { expect, test, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function configureTargetRangeForTimeline(page: Page) {
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

  await targetDialog.getByLabel('Lower limit').fill('4.0');
  await targetDialog.getByLabel('Upper limit').fill('10.0');

  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/medical/me/glucose-target-profile') &&
      response.request().method() === 'PUT',
  );
  await targetDialog.getByRole('button', { name: 'Save', exact: true }).click();
  expect((await putPromise).ok()).toBeTruthy();
  await expect(targetDialog).toBeHidden();
}

async function openDemoGlucoseCard(page: Page) {
  const glucoseCard = page
    .getByRole('button', { name: /Open event: Glucose, 7\.3 mmol\/L/i })
    .first();

  await expect(glucoseCard).toBeVisible();

  return glucoseCard;
}

test.describe('Timeline glucose card source presentation', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('configured-target glucose card shows value, range, qualifier, and source', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-card-source-target@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);

    await expect(glucoseCard.getByText('7.3')).toBeVisible();
    await expect(glucoseCard.getByText('In your range')).toBeVisible();
    await expect(glucoseCard.getByText('Current target range')).toBeVisible();
    await expect(glucoseCard.getByText('Demo data')).toBeVisible();
  });

  test('no-target glucose card shows source without range or qualifier', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-card-source-no-target@example.com',
    );
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);

    await expect(glucoseCard.getByText('7.3')).toBeVisible();
    await expect(glucoseCard.getByText('Demo data')).toBeVisible();
    await expect(glucoseCard.getByText('In your range')).toHaveCount(0);
    await expect(glucoseCard.getByText('Current target range')).toHaveCount(0);
  });

  test('suspect-future glucose card shows warning and source without confident range', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-card-source-future@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    await glucoseCard.click();
    await page.getByRole('button', { name: 'Edit' }).click();

    await page.getByRole('dialog').getByLabel('Date').fill('2026-08-02');
    await page.getByRole('dialog').getByLabel('Event time').fill('20:00');
    await page.getByRole('button', { name: 'Save' }).click();

    const updatedCard = page
      .getByRole('button', { name: /Open event: Glucose, 7\.3 mmol\/L/i })
      .first();

    await expect(updatedCard.getByText('Check measurement time')).toBeVisible();
    await expect(updatedCard.getByText('Demo data')).toBeVisible();
    await expect(updatedCard.getByText('In your range')).toHaveCount(0);
    await expect(updatedCard.getByText('Current target range')).toHaveCount(0);
  });

  test('opening glucose detail still works and focus returns on close', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-card-source-focus@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    await glucoseCard.click();

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText('Demo data')).toBeVisible();

    await page
      .getByRole('button', { exact: true, name: 'Close details' })
      .click();
    await expect(detailDialog).toBeHidden();
    await expect(glucoseCard).toBeFocused();
  });

  test('glucose card has no horizontal overflow at 360px mobile width', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ height: 800, width: 360 });
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-card-source-mobile@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    const box = await glucoseCard.boundingBox();

    expect(box?.width).toBeLessThanOrEqual(360);
    await expect(glucoseCard.getByText('Demo data')).toBeVisible();

    const hasHorizontalScroll = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );

    expect(hasHorizontalScroll).toBe(false);
  });
});
