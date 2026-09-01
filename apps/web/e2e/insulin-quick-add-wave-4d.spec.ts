import { expect, test, type Page } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { installOneShotTimelineEventsWriteDelay } from './support/install-one-shot-timeline-events-write-delay';
import {
  clearTimelineEventsInIndexedDb,
  waitForEmptyTimelineInIndexedDb,
  waitForTimelineBootstrapComplete,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const PREPARATION_TRIGGER = /Insulin preparation/;
const DOSE_LABEL = 'Insulin dose';

async function prepareEmptyTimeline(page: Page) {
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForEmptyTimelineInIndexedDb(page);
}

async function openInsulinQuickAdd(page: Page) {
  await page.goto('/timeline');
  await prepareEmptyTimeline(page);
  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
}

test.describe('Insulin Quick Add Wave 4D save integrity', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('timeline insulin save awaits persistence before close', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'insulin-quick-add-save-timeline@example.com',
    );
    await openInsulinQuickAdd(page);

    const dialog = page.getByRole('dialog', { name: 'Добавить инсулин' });
    await page.getByRole('button', { name: PREPARATION_TRIGGER }).click();
    await page
      .getByRole('dialog', { name: 'Insulin preparation', exact: true })
      .getByRole('button', { name: 'NovoRapid', exact: true })
      .click();
    await page.getByLabel(DOSE_LABEL).fill('4');
    await installOneShotTimelineEventsWriteDelay(page, 750);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(dialog.getByRole('status')).toHaveText('Saving…');
    await expect(dialog).toHaveAttribute('aria-busy', 'true');
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole('button', { name: /Open event: NovoRapid/i }).first(),
    ).toBeVisible();
  });

  test('pending insulin save blocks Escape and header Back dismissal', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'insulin-quick-add-save-dismiss@example.com',
    );
    await openInsulinQuickAdd(page);

    const dialog = page.getByRole('dialog', { name: 'Добавить инсулин' });
    await page.getByRole('button', { name: PREPARATION_TRIGGER }).click();
    await page
      .getByRole('dialog', { name: 'Insulin preparation', exact: true })
      .getByRole('button', { name: 'NovoRapid', exact: true })
      .click();
    await page.getByLabel(DOSE_LABEL).fill('4');
    await installOneShotTimelineEventsWriteDelay(page, 750);
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(dialog.getByRole('status')).toHaveText('Saving…');
    await expect(dialog).toHaveAttribute('aria-busy', 'true');

    await page.keyboard.press('Escape');
    await expect(dialog).toBeVisible();

    const headerBack = dialog.getByRole('button', {
      name: /Back to category selection|Назад к выбору типа/i,
    });
    if (await headerBack.isVisible()) {
      await expect(headerBack).toBeDisabled();
    }

    await expect(
      dialog.getByRole('button', { name: /Cancel|Отмена/i }),
    ).toBeDisabled();

    await expect(dialog).toBeHidden();
  });

  test('timeline insulin double submit creates one event', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(
      page,
      request,
      'insulin-quick-add-save-double@example.com',
    );
    await openInsulinQuickAdd(page);

    const dialog = page.getByRole('dialog', { name: 'Добавить инсулин' });
    await page.getByRole('button', { name: PREPARATION_TRIGGER }).click();
    await page
      .getByRole('dialog', { name: 'Insulin preparation', exact: true })
      .getByRole('button', { name: 'NovoRapid', exact: true })
      .click();
    await page.getByLabel(DOSE_LABEL).fill('4');
    const saveButton = dialog.getByRole('button', {
      name: 'Save',
      exact: true,
    });
    await saveButton.dblclick();
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole('button', { name: /Open event: NovoRapid/i }),
    ).toHaveCount(1);
  });
});
