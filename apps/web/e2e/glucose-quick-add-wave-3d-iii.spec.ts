import { expect, test, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import {
  clearTimelineEventsInIndexedDb,
  waitForEmptyTimelineInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';
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

async function prepareEmptyTimeline(page: Page): Promise<void> {
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForEmptyTimelineInIndexedDb(page);
}

test.describe('Glucose Quick Add Wave 3D-III save integrity', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('dashboard direct-open persists before close and updates timeline', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-save-dashboard@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/');
    await prepareEmptyTimeline(page);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await page.getByLabel('Glucose level').fill('6.1');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(dialog.getByRole('status')).toHaveText('Saving…');
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(dialog).toBeHidden();

    await page.getByRole('link', { name: 'Details' }).click();
    await waitForApplicationReady(page);

    await expect(
      page
        .getByRole('button', { name: /Open event: Glucose, 6\.1 mmol\/L/i })
        .first(),
    ).toBeVisible();
  });

  test('pending save blocks Escape and header Back dismissal', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-save-dismiss@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/');
    await prepareEmptyTimeline(page);

    await page.getByRole('button', { name: 'Quick add: Glucose' }).click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await page.getByLabel('Glucose level').fill('6.3');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await page.waitForFunction(() => {
      const panel = document.querySelector('[role="dialog"][aria-busy="true"]');

      if (panel === null) {
        return false;
      }

      document.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
      );

      const headerBack = panel.querySelector(
        'button[aria-label="Назад к выбору типа"]',
      );
      const cancelButton = [...panel.querySelectorAll('button')].find(
        (button) => /^(Cancel|Отмена)$/.test(button.textContent ?? ''),
      );

      return (
        panel.isConnected &&
        headerBack instanceof HTMLButtonElement &&
        headerBack.disabled &&
        cancelButton instanceof HTMLButtonElement &&
        cancelButton.disabled
      );
    });

    await expect(dialog).toBeVisible();
    await expect(dialog).toBeHidden();
  });

  test('timeline direct-open double submit creates one glucose event', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'glucose-quick-add-save-timeline@example.com',
    );
    await ensureGlucoseUnitConfigured(page);
    await page.goto('/timeline');
    await prepareEmptyTimeline(page);

    await page.setViewportSize({ height: 844, width: 390 });
    await page.locator('#timeline-mobile-quick-add-fab').click();
    await page
      .getByRole('button', { name: 'Глюкоза. Записать уровень сахара' })
      .click();

    const dialog = page.getByRole('dialog', { name: 'Добавить глюкозу' });
    await page.getByLabel('Glucose level').fill('5.6');
    const saveButton = dialog.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    await saveButton.dblclick();
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole('button', { name: /Open event: Glucose, 5\.6 mmol\/L/i }),
    ).toHaveCount(1);
  });
});
