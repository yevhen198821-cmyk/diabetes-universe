import { expect, test } from '@playwright/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

test('unauthenticated home profile navigation redirects to sign-in with account callback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Open account' }).click();
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount/);
});

test('authenticated home profile navigation opens account profile', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-home-nav@example.com');

  await page.goto('/');
  await waitForApplicationReady(page);
  await page.getByRole('button', { name: 'Open account' }).click();

  await expect(page).toHaveURL(/\/account$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile' }),
  ).toBeVisible();
});

test('unauthenticated account settings and security routes redirect to sign-in', async ({
  page,
}) => {
  await page.goto('/account/settings');
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount%2Fsettings/);

  await page.goto('/account/security');
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount%2Fsecurity/);
});

test('authenticated account settings and security routes render profile shell', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-account-routes@example.com',
  );

  await page.goto('/account/settings');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible();

  await page.goto('/account/security');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('tab', { name: 'Security', selected: true }),
  ).toBeVisible();
});
