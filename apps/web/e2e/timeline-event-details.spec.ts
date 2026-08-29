import { expect, test, type Page } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

const openEvent = async (page: Page, name: RegExp | string) => {
  const card = page.getByRole('button', { name }).first();

  await card.click();

  return card;
};

test('timeline event details open, close with Escape, and return focus', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const card = await openEvent(page, /Open event: Метформин/);

  await expect(page.getByRole('dialog', { name: 'Метформин' })).toBeVisible();
  const detailDialog = page.getByRole('dialog', { name: 'Метформин' });
  await expect(detailDialog.getByText('Medication')).toBeVisible();
  await expect(detailDialog.getByText('400 mg').first()).toBeVisible();
  await expect(detailDialog.getByText('Demo data')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Метформин' })).toBeHidden();
  await expect(card).toBeFocused();
});

test('timeline event edit updates Timeline and Dashboard selectors', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Glucose, 7\.3 mmol\/L/);
  await page.getByRole('button', { name: 'Edit' }).click();

  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  await page.getByLabel('Value').fill('9.1');
  await page.getByLabel('Event time').fill('11:30');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page.getByText('9.1 mmol/L').first()).toBeVisible();

  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();
  await page.getByRole('link', { name: 'Go to home' }).click();

  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText('9.1', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('9.1 mmol/L').first()).toBeVisible();
});

test('timeline edit moves an event to another day via day navigation', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Breakfast/);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page
    .getByRole('dialog', { name: 'Edit event' })
    .getByLabel('Date')
    .fill('2026-08-01');
  await page.getByRole('button', { name: 'Save' }).click();
  await page
    .getByRole('button', { exact: true, name: 'Close details' })
    .click();

  await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(page.getByText('Breakfast').first()).toBeVisible();
});

test('timeline event delete requires confirmation and updates Dashboard', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: NovoRapid/);
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Delete event?' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Delete event?' }),
  ).toBeHidden();
  await expect(page.getByRole('dialog', { name: 'NovoRapid' })).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).click();
  await page
    .getByRole('dialog', { name: 'Delete event?' })
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(page.getByText('NovoRapid').first()).toBeHidden();

  await page.getByRole('link', { name: 'Go to home' }).click();
  await expect(
    page.getByRole('region', { name: 'Today' }).getByText('0 U'),
  ).toBeVisible();
});

test('timeline closes details when edited event leaves search results', async ({
  page,
}) => {
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  const search = page.getByLabel('Search events');

  await search.fill('Метформин');
  await openEvent(page, /Open event: Метформин/);
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Title').fill('Сиофор');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page.getByRole('heading', { name: 'No matching events' }),
  ).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('timeline event details work on mobile without horizontal scroll', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto('/timeline');
  await waitForApplicationReady(page);

  await openEvent(page, /Open event: Метформин/);

  const dialog = page.getByRole('dialog', { name: 'Метформин' });
  const box = await dialog.boundingBox();

  expect(box?.width).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('dialog', { name: 'Edit event' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Delete event?' }),
  ).toBeVisible();
  await page.keyboard.press('Escape');

  const hasHorizontalScroll = await page.evaluate(
    () =>
      document.documentElement.scrollWidth >
      document.documentElement.clientWidth,
  );

  expect(hasHorizontalScroll).toBe(false);
});
