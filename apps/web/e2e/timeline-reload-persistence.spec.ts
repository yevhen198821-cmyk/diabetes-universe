import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

async function clearTimelineEventsInIndexedDb(
  page: import('@playwright/test').Page,
) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('diabetes-universe-timeline');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const database = request.result;
        const transaction = database.transaction(
          'timeline_events',
          'readwrite',
        );
        transaction.objectStore('timeline_events').clear();
        transaction.oncomplete = () => {
          database.close();
          resolve();
        };
        transaction.onerror = () => {
          database.close();
          reject(transaction.error);
        };
      };
    });
  });
}

test('timeline note persists across page reload', async ({ page }) => {
  const noteText = 'E2E reload persistence marker';

  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Добавить заметку' }),
  ).toBeVisible();

  await page.getByLabel('Текст заметки').fill(noteText);
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.reload();
  await waitForApplicationReady(page);

  await expect(page.getByText(noteText).first()).toBeVisible();
});

test('deleted timeline note remains deleted across page reload', async ({
  page,
}) => {
  const noteText = 'E2E delete persistence marker';

  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page.getByRole('button', { name: 'Заметка. Добавить запись' }).click();
  await page.getByLabel('Текст заметки').fill(noteText);
  await page.getByRole('button', { name: 'Сохранить' }).click();
  await expect(page.getByText(noteText).first()).toBeVisible();

  await page.getByText(noteText).first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Delete event?' });
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole('button', { name: 'Delete', exact: true })
    .click();

  await expect(page.getByText(noteText)).toHaveCount(0);

  await page.reload();
  await waitForApplicationReady(page);

  await expect(page.getByText(noteText)).toHaveCount(0);
});

test('empty durable timeline does not reseed demo data after reload', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);
  await expect(page.locator('#timeline-events-list')).toHaveCount(1);

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
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('7');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(
    page.getByRole('region', { name: 'Today' }).getByText('11 U'),
  ).toBeVisible();

  await page.reload();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Today' }).getByText('11 U'),
  ).toBeVisible();
});
