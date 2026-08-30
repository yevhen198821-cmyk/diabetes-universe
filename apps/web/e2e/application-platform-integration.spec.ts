import { expect, test } from './support/test';

import {
  APPLICATION_PLATFORM_READY_SELECTOR,
  waitForApplicationReady,
} from './support/wait-for-application-ready';

test('dashboard to timeline client navigation preserves application ready root', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const readyRoot = page.locator(APPLICATION_PLATFORM_READY_SELECTOR);
  const mountProbe = await readyRoot.evaluate((element) => {
    const marker = element as HTMLElement;

    if (marker.dataset.platformMountProbe === undefined) {
      marker.dataset.platformMountProbe = crypto.randomUUID();
    }

    return marker.dataset.platformMountProbe;
  });

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);

  const mountProbeAfterNavigation = await readyRoot.evaluate(
    (element) => (element as HTMLElement).dataset.platformMountProbe,
  );

  expect(mountProbeAfterNavigation).toBe(mountProbe);
});

test('dashboard to timeline client navigation preserves timeline store state', async ({
  page,
}) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  const daySummary = page.getByRole('region', { name: 'Today' });

  await expect(daySummary.getByText('4 U')).toBeVisible();

  await page.getByRole('button', { name: 'Quick add: Insulin' }).click();
  await page.getByRole('button', { name: /Insulin preparation/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByRole('textbox', { name: 'Insulin dose' }).fill('3');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(daySummary.getByText('7 U')).toBeVisible();

  await page.getByRole('link', { name: 'All events' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);
  await expect(page.getByText('3 U').first()).toBeVisible();
});
