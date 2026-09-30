import { readFile } from 'node:fs/promises';
import { expect, test } from './support/test';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test('anonymous profile can export its local archive and reach Resulto support', async ({
  page,
}) => {
  await page.goto('/data');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { name: 'Data and storage' }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Export this browser’s data', exact: true })
    .click();
  const download = await downloadPromise;
  const archive = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(archive.format).toBe('diabetes-universe-local');
  expect(archive.scope).toBe('current-browser-profile');
  expect(Array.isArray(archive.stores.timeline_events)).toBe(true);
  expect(Array.isArray(archive.stores.timeline_quarantine)).toBe(true);
  await page.goto('/support');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('link', { name: 'resulto.universe@gmail.com' }),
  ).toHaveAttribute('href', 'mailto:resulto.universe@gmail.com');
  await expect(
    page.getByText('Operator: Resulto, Poland.', { exact: true }),
  ).toBeVisible();
});
