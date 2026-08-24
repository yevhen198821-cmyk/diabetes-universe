import { expect, test } from './support/test';

import { waitForApplicationReady } from './support/wait-for-application-ready';

test('home does not render next action block', async ({ page }) => {
  await page.goto('/');
  await waitForApplicationReady(page);

  await expect(page.getByText('Next action')).toHaveCount(0);
  await expect(page.getByText('Следующее действие')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Add insulin' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('button', { name: 'Add', exact: true }),
  ).toHaveCount(0);
});
