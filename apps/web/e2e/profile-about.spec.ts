import { expect, test } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

async function openProfile(page: import('./support/test').Page) {
  await page.goto('/account');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile' }),
  ).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('profile about row navigates to the about screen', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-about-nav@example.com');
  await openProfile(page);

  await page.getByRole('link', { name: /About the app/i }).click();
  await expect(page).toHaveURL(/\/account\/about$/);
  await expect(
    page.getByRole('heading', { level: 2, name: 'About the app' }),
  ).toBeVisible();
  await expect(page.getByText('Version: 0.0.0')).toHaveCount(0);
  await expect(page.getByText('Medical information')).toBeVisible();
  await expect(page.getByText('Privacy and data')).toBeVisible();
  await expect(page.getByText('Coming later')).toHaveCount(10);
});

test('about screen stays inside profile shell with account navigation', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-about-shell@example.com');
  await page.goto('/account/about');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('tab', { name: 'Profile', selected: true }),
  ).toBeVisible();
  await expect(page.locator('#dashboard-mobile-nav')).toBeVisible();
  await expect(
    page
      .locator('#dashboard-mobile-nav')
      .getByRole('link', { name: 'Account' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('about screen requires authentication', async ({ page }) => {
  await page.goto('/account/about');
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount%2Fabout/);
});
