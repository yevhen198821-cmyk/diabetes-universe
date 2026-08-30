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

test.describe('Timeline glucose event detail presentation', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('configured target shows glucose history fields in detail', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-detail-target@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    await glucoseCard.click();

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText('7.3 mmol/L').first()).toBeVisible();
    await expect(detailDialog.getByText('In your range')).toBeVisible();
    await expect(detailDialog.getByText('Current target range')).toBeVisible();
    await expect(detailDialog.getByText('Demo data')).toBeVisible();
    await expect(detailDialog.getByText('After meal')).toBeVisible();
    await expect(
      detailDialog.locator('time[datetime="2026-08-02T07:15:00.000Z"]'),
    ).toBeVisible();
  });

  test('no configured target hides range and qualifier in detail', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-detail-no-target@example.com',
    );
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    await glucoseCard.click();

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog.getByText('7.3 mmol/L').first()).toBeVisible();
    await expect(detailDialog.getByText('Demo data')).toBeVisible();
    await expect(
      detailDialog.locator('time[datetime="2026-08-02T07:15:00.000Z"]'),
    ).toBeVisible();
    await expect(detailDialog.getByText('In your range')).toHaveCount(0);
    await expect(detailDialog.getByText('Current target range')).toHaveCount(0);
  });

  test('suspect-future glucose detail shows warning without confident range', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-detail-future@example.com',
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

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog.getByText('7.3 mmol/L').first()).toBeVisible();
    await expect(
      detailDialog.getByText('Check measurement time'),
    ).toBeVisible();
    await expect(
      detailDialog.locator('time[datetime="2026-08-02T20:00:00.000Z"]'),
    ).toBeVisible();
    await expect(detailDialog.getByText('In your range')).toHaveCount(0);
    await expect(detailDialog.getByText('Current target range')).toHaveCount(0);
  });

  test('closing glucose detail returns focus to the originating card', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'timeline-glucose-detail-focus@example.com',
    );
    await configureTargetRangeForTimeline(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    const glucoseCard = await openDemoGlucoseCard(page);
    await glucoseCard.click();
    await expect(page.getByRole('dialog', { name: 'Glucose' })).toBeVisible();

    await page
      .getByRole('button', { exact: true, name: 'Close details' })
      .click();
    await expect(page.getByRole('dialog', { name: 'Glucose' })).toBeHidden();
    await expect(glucoseCard).toBeFocused();
  });
});
