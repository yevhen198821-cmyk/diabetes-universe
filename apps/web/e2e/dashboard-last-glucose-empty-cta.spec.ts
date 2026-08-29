import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';
import { selectGlucoseUnitIfRequired } from './support/glucose-quick-add-helpers';

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

test('empty glucose hero CTA opens glucose Quick Add without creating an event', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);
  await clearTimelineEventsInIndexedDb(page);
  await page.reload();
  await waitForApplicationReady(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });

  await expect(
    lastGlucoseRegion.getByText('No measurements yet.'),
  ).toBeVisible();
  await expect(
    lastGlucoseRegion.getByRole('button', { name: 'Add glucose' }),
  ).toBeVisible();

  await lastGlucoseRegion.getByRole('button', { name: 'Add glucose' }).click();
  await selectGlucoseUnitIfRequired(page);
  await expect(page.getByLabel('Glucose level')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Glucose level')).toHaveCount(0);
  await expect(
    lastGlucoseRegion.getByText('No measurements yet.'),
  ).toBeVisible();
  await expect(lastGlucoseRegion.getByText(/\d/)).toHaveCount(0);
});

test('empty glucose CTA remains accessible on mobile widths', async ({
  browser,
}) => {
  for (const viewport of [
    { height: 800, width: 360 },
    { height: 844, width: 390 },
    { height: 915, width: 412 },
  ]) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    await page.goto('/');
    await waitForApplicationReady(page);
    await clearTimelineEventsInIndexedDb(page);
    await page.reload();
    await waitForApplicationReady(page);

    const button = page
      .getByRole('region', { name: 'Last glucose' })
      .getByRole('button', { name: 'Add glucose' });

    await expect(button).toBeVisible();

    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);

    const overflowWidth = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflowWidth).toBe(false);

    await context.close();
  }
});
