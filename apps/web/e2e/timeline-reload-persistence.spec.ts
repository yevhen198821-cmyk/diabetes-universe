import { expect, test } from './support/test';

import {
  clearTimelineEventsInIndexedDb,
  prepareCanonicalDemoTimelineFixture,
  readActiveTimelineStoredEvents,
  waitForTimelineBootstrapComplete,
  waitForTimelineOwnershipReady,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function prepareEmptyTimeline(page: import('./support/test').Page) {
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
  await waitForTimelineBootstrapComplete(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
}

test('timeline note persists across page reload', async ({ page }) => {
  const noteText = 'E2E reload persistence marker';

  await page.goto('/timeline');
  await prepareEmptyTimeline(page);

  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  const dialog = page.getByRole('dialog', { name: 'Добавить заметку' });
  await expect(dialog).toBeVisible();

  await page.getByLabel('Текст заметки').fill(noteText);
  await dialog.getByRole('button', { name: 'Сохранить' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(noteText).first()).toBeVisible();
  await expect
    .poll(async () => {
      const events = await readActiveTimelineStoredEvents(page);
      return events.filter(
        (event) => event.kind === 'note' && event.body === noteText,
      ).length;
    })
    .toBe(1);

  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);

  await expect(page.getByText(noteText).first()).toBeVisible();
});

test('deleted timeline note remains deleted across page reload', async ({
  page,
}) => {
  const noteText = 'E2E delete persistence marker';

  await page.goto('/timeline');
  await prepareEmptyTimeline(page);

  await page.setViewportSize({ height: 844, width: 390 });
  await page.locator('#timeline-mobile-quick-add-fab').click();
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  const dialog = page.getByRole('dialog', { name: 'Добавить заметку' });
  await page.getByLabel('Текст заметки').fill(noteText);
  await dialog.getByRole('button', { name: 'Сохранить' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(noteText).first()).toBeVisible();
  await expect
    .poll(async () => {
      const events = await readActiveTimelineStoredEvents(page);
      return events.filter(
        (event) => event.kind === 'note' && event.body === noteText,
      ).length;
    })
    .toBe(1);

  await page.getByText(noteText).first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete event?' });
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole('button', { name: 'Delete', exact: true })
    .click();

  await expect(page.getByText(noteText)).toHaveCount(0);
  await expect
    .poll(async () => {
      const events = await readActiveTimelineStoredEvents(page);
      return events.some(
        (event) => event.kind === 'note' && event.body === noteText,
      );
    })
    .toBe(false);

  await page.reload();
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);

  await expect(page.getByText(noteText)).toHaveCount(0);
});

test('empty durable timeline does not reseed demo data after reload', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await waitForTimelineBootstrapComplete(page);
  await expect(
    page.getByRole('heading', { name: 'No events yet' }),
  ).toBeVisible();
  await expect(page.locator('#timeline-events-list')).toHaveCount(0);

  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'No events yet' }),
  ).toBeVisible();
  await expect(page.locator('#timeline-events-list')).toHaveCount(0);

  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'No events yet' }),
  ).toBeVisible();
  await expect(page.locator('#timeline-events-list')).toHaveCount(0);
});

test('dashboard quick add insulin persists across page reload', async ({
  page,
}) => {
  await page.goto('/');
  await prepareCanonicalDemoTimelineFixture(page);

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await page.getByRole('button', { name: /Insulin preparation/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByRole('textbox', { name: 'Insulin dose' }).fill('7');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('region', { name: 'Today' }).getByText('11 U'),
  ).toBeVisible();

  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Today' }).getByText('11 U'),
  ).toBeVisible();
});
