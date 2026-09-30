import { expect, test } from './support/test';

declare global {
  interface Window {
    __emptyGlucoseFlashed?: boolean;
  }
}

import { prepareCanonicalDemoTimelineFixture } from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';
import {
  saveGlucoseQuickAdd,
  selectGlucoseUnitIfRequired,
} from './support/glucose-quick-add-helpers';

test('dashboard last glucose renders English labels and syncs with timeline edits', async ({
  page,
}) => {
  await page.goto('/');
  await prepareCanonicalDemoTimelineFixture(page);

  const lastGlucoseRegion = page.getByRole('region', { name: 'Last glucose' });

  await expect(
    page.getByRole('heading', { name: 'Last glucose' }),
  ).toBeVisible();
  await expect(page.getByText('Последняя глюкоза')).toHaveCount(0);
  await expect(
    lastGlucoseRegion.getByText('7.3', { exact: true }),
  ).toBeVisible();
  await expect(
    lastGlucoseRegion.getByText('mmol/L', { exact: true }),
  ).toBeVisible();
  await expect(lastGlucoseRegion.locator('time')).toBeVisible();

  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await selectGlucoseUnitIfRequired(page);
  await page.getByLabel('Glucose level').fill('7.7');
  await saveGlucoseQuickAdd(page);

  await expect(
    lastGlucoseRegion.getByText('7.7', { exact: true }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: /Open event: Glucose, 7\.7 mmol\/L/ })
    .click();
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Value').fill('8.2');
  await page.getByRole('button', { name: 'Save' }).click();
  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('8.2', {
      exact: true,
    }),
  ).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await page
    .getByRole('button', { name: /Open event: Glucose, 8\.2 mmol\/L/ })
    .click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('7.3', {
      exact: true,
    }),
  ).toBeVisible();
});

test('refresh keeps saved glucose loading until profile resolution without flashing the empty CTA', async ({
  page,
}) => {
  await page.goto('/');
  await prepareCanonicalDemoTimelineFixture(page);
  const region = page.getByRole('region', { name: 'Last glucose' });
  await expect(region.getByText('7.3', { exact: true })).toBeVisible();
  await page.addInitScript(() => {
    window.__emptyGlucoseFlashed = false;
    new MutationObserver(() => {
      if (
        Array.from(document.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'Add glucose',
        )
      )
        window.__emptyGlucoseFlashed = true;
    }).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/auth/get-session*', async (route) => {
    await pending;
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForApplicationReady(page);
    await expect(
      page.locator('[data-timeline-ownership="pending"]'),
    ).toBeVisible();
    await expect(region.getByRole('status')).toHaveText(
      'Loading last glucose measurement',
    );
    await expect(
      region.getByRole('button', { name: 'Add glucose', exact: true }),
    ).toHaveCount(0);
    release();
    await expect(region.getByText('7.3', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => window.__emptyGlucoseFlashed)).toBe(false);
  } finally {
    release();
  }
});
