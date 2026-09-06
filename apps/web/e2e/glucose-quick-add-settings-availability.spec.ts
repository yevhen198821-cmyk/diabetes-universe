import { expect, test } from '@playwright/test';

import { CANONICAL_DEMO_LOCAL_DAY_TIME } from '../testing/demo-reference-time';
import { prepareEmptyTimelineDashboardFixture } from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test.describe('Glucose Quick Add settings availability', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('fresh session loads settings path and persists a glucose reading', async ({
    page,
  }) => {
    await page.clock.install({ time: CANONICAL_DEMO_LOCAL_DAY_TIME });
    await page.goto('/');
    await prepareEmptyTimelineDashboardFixture(page);

    const settings = await page.request.get(
      '/api/v1/medical/me/diabetes-settings',
    );
    expect([401, 200]).toContain(settings.status());
    expect(settings.status()).not.toBe(503);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText('Could not load glucose settings'),
    ).toHaveCount(0);

    const valueInput = page.getByLabel('Glucose level');
    if (await valueInput.isDisabled()) {
      await expect(
        dialog.getByRole('heading', { name: 'Choose glucose units' }),
      ).toBeVisible();
      await dialog.getByRole('button', { name: 'mmol/L', exact: true }).click();
    }

    await expect(valueInput).toBeEnabled();
    await expect(dialog.getByText('mmol/L', { exact: true })).toBeVisible();
    await valueInput.fill('6.3');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog).toBeHidden();

    await page.getByRole('link', { name: 'Details' }).click();
    await waitForApplicationReady(page);

    const glucoseCard = page
      .getByRole('button', { name: /Open event: Glucose, 6\.3 mmol\/L/i })
      .first();
    await expect(glucoseCard).toBeVisible();

    await page.reload();
    await waitForApplicationReady(page);
    await expect(glucoseCard).toBeVisible();
  });
});
