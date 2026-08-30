import { expect, test, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { prepareEmptyTimelineDashboardFixture } from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function ensureGlucoseUnitConfigured(page: Page): Promise<void> {
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
}

test.describe('Glucose Quick Add Wave 3D-II', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('dashboard direct open focuses value, shows unit, saves event without default context', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-configured@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/');
    await prepareEmptyTimelineDashboardFixture(page);
    await waitForApplicationReady(page);

    const glucoseButton = page.getByRole('button', {
      name: 'Quick add: Glucose',
    });
    await glucoseButton.click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await expect(dialog).toBeVisible();

    const valueInput = page.getByLabel('Glucose level');
    await expect(valueInput).toBeFocused();
    await expect(dialog.getByText('mmol/L', { exact: true })).toBeVisible();
    await valueInput.fill('6.2');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('link', { name: 'Details' }).click();
    await waitForApplicationReady(page);

    const glucoseCard = page
      .getByRole('button', { name: /Open event: Glucose, 6\.2 mmol\/L/i })
      .first();
    await expect(glucoseCard).toBeVisible();
    await glucoseCard.click();

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText('6.2 mmol/L').first()).toBeVisible();
    await expect(detailDialog.getByText('Fasting')).toHaveCount(0);
    await expect(detailDialog.getByText('Before meal')).toHaveCount(0);
    await expect(detailDialog.getByText('After meal')).toHaveCount(0);
  });

  test('explicit context appears in saved event detail', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-context@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/');
    await prepareEmptyTimelineDashboardFixture(page);
    await waitForApplicationReady(page);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await dialog.getByRole('button', { name: 'Add context' }).click();
    await page
      .getByRole('button', { name: 'Before meal', exact: true })
      .click();
    await page.getByLabel('Glucose level').fill('5.5');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('link', { name: 'Details' }).click();
    await waitForApplicationReady(page);

    const glucoseCard = page
      .getByRole('button', { name: /Open event: Glucose, 5\.5 mmol\/L/i })
      .first();
    await glucoseCard.click();

    const detailDialog = page.getByRole('dialog', { name: 'Glucose' });
    await expect(detailDialog.getByText('Before meal')).toBeVisible();
  });

  test('direct-open cancel closes Quick Add instead of opening category picker', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-cancel@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/');
    await waitForApplicationReady(page);

    const glucoseButton = page.getByRole('button', {
      name: 'Quick add: Glucose',
    });
    await glucoseButton.click();

    const glucoseDialog = page.getByRole('dialog', {
      name: 'Добавить глюкозу',
    });
    await expect(glucoseDialog).toBeVisible();
    await glucoseDialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(glucoseDialog).toBeHidden();
    await expect(
      page.getByRole('dialog', { name: 'Добавить событие' }),
    ).toHaveCount(0);
    await expect(glucoseButton).toBeFocused();
  });

  test('picker-open glucose cancel returns to category picker', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-picker@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/timeline');
    await waitForApplicationReady(page);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.locator('#timeline-mobile-quick-add-fab').click();

    const pickerDialog = page.getByRole('dialog', { name: 'Добавить событие' });
    await expect(pickerDialog).toBeVisible();
    await pickerDialog
      .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
      .click();

    const glucoseDialog = page.getByRole('dialog', {
      name: 'Добавить глюкозу',
    });
    await expect(glucoseDialog).toBeVisible();
    await glucoseDialog.getByRole('button', { name: 'Отмена' }).click();
    await expect(glucoseDialog).toBeHidden();
    await expect(pickerDialog).toBeVisible();
  });

  test('unconfigured settings block entry and show diabetes settings CTA', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-unconfigured@example.com',
    );

    await page.route(
      '**/api/v1/medical/me/diabetes-settings',
      async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            body: JSON.stringify({
              configured: false,
              createdAt: '2026-08-02T00:00:00.000Z',
              diabetesType: {
                category: 'unknown',
                source: 'self_reported',
              },
              glucoseDisplayUnit: null,
              revision: '1',
              settingsId: '00000000-0000-4000-8000-000000000001',
              subjectId: '00000000-0000-4000-8000-000000000002',
              updatedAt: '2026-08-02T00:00:00.000Z',
            }),
            contentType: 'application/json',
            status: 200,
          });
          return;
        }

        await route.continue();
      },
    );

    await page.goto('/');
    await waitForApplicationReady(page);
    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await expect(
      dialog.getByRole('heading', { name: 'Glucose unit not configured' }),
    ).toBeVisible();
    await expect(page.getByLabel('Glucose level')).toBeDisabled();
    await expect(
      dialog.getByRole('link', { name: 'Open Diabetes settings' }),
    ).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'mmol/L' })).toHaveCount(0);
    await expect(dialog.getByRole('button', { name: 'mg/dL' })).toHaveCount(0);
  });

  test('mobile layout keeps glucose entry usable at 360px width', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-mobile@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.setViewportSize({ height: 800, width: 360 });
    await page.goto('/');
    await waitForApplicationReady(page);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();

    const valueInput = page.getByLabel('Glucose level');
    await expect(valueInput).toBeFocused();
    await expect(valueInput).toBeVisible();
    await valueInput.fill('6.0');

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);
  });
});
