import { expect, test } from '@playwright/test';

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

  await page.getByRole('link', { name: 'Все события' }).click();
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

  const daySummary = page.getByRole('region', { name: 'Day summary' });

  await expect(daySummary.getByText('4 ЕД')).toBeVisible();

  await page.getByRole('button', { name: 'Add event' }).click();
  await page
    .getByRole('button', { name: 'Инсулин. Записать дозу инсулина' })
    .click();
  await page.getByRole('button', { name: /Препарат/ }).click();
  await page.getByRole('button', { name: 'NovoRapid' }).click();
  await page.getByLabel('Доза').fill('3');
  await page.getByRole('button', { name: 'Сохранить' }).click();

  await expect(daySummary.getByText('7 ЕД')).toBeVisible();

  await page.getByRole('link', { name: 'Все события' }).click();
  await expect(page).toHaveURL('/timeline');
  await waitForApplicationReady(page);
  await expect(page.getByText('3 ЕД').first()).toBeVisible();
});
