import { type Browser } from '@playwright/test';

import { expect, test } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const THEME_STORAGE_KEY = 'du-ui-theme';

async function openProfile(
  page: import('./support/test').Page,
  headingName: string | RegExp = 'Profile',
) {
  await page.goto('/account');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: headingName }),
  ).toBeVisible();
}

async function createLocalizedPage(
  browser: Browser,
  locale: string,
  options?: { viewport?: { height: number; width: number } },
) {
  const context = await browser.newContext({
    locale,
    extraHTTPHeaders: { 'Accept-Language': locale },
    viewport: options?.viewport ?? { width: 390, height: 844 },
  });
  const page = await context.newPage();

  return { context, page };
}

test.describe.configure({ mode: 'serial' });

test('profile renders segmented shell with active bottom navigation', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-wave1@example.com');
  await openProfile(page);

  await expect(
    page.getByRole('tab', { name: 'Profile', selected: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('#dashboard-mobile-nav')
      .getByRole('link', { name: 'Account' }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByLabel('Add event')).toHaveCount(0);
  await expect(page.locator('#timeline-mobile-quick-add-fab')).toHaveCount(0);
});

test('profile menu shows disabled coming-later rows and sign out action', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, 'profile-wave1-menu@example.com');
  await openProfile(page);

  await expect(page.getByText('Coming later')).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: 'Sign out', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Type 1 diabetes')).toHaveCount(0);
  await expect(page.getByText('Diagnosis:')).toHaveCount(0);
});

test('profile segmented navigation switches to settings and security routes', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-wave1-segments@example.com',
  );
  await openProfile(page);

  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/account\/settings$/);
  await expect(
    page.getByRole('heading', { name: 'Settings', exact: true }),
  ).toBeVisible();

  await page.getByRole('tab', { name: 'Security' }).click();
  await expect(page).toHaveURL(/\/account\/security$/);
  await expect(
    page.getByRole('link', { name: 'Active sessions' }),
  ).toBeVisible();
});

test('profile EN chrome has no unintended Russian strings', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, 'profile-wave1-en@example.com');
  await openProfile(page);

  await expect(
    page.getByText('Manage your account and preferences'),
  ).toBeVisible();
  await expect(page.getByText('Профиль')).toHaveCount(0);
  await expect(page.getByText('Выйти из аккаунта')).toHaveCount(0);
});

test('profile RU chrome stays localized', async ({ browser, request }) => {
  const { context, page } = await createLocalizedPage(browser, 'ru-RU');
  await signInWithMagicLink(page, request, 'profile-wave1-ru@example.com');
  await openProfile(page, 'Профиль');

  await expect(
    page.getByText('Управляйте аккаунтом и настройками'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Выйти из аккаунта', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('Manage your account and preferences'),
  ).toHaveCount(0);

  await context.close();
});

test('profile UK and DE layouts remain readable on mobile', async ({
  browser,
  request,
}) => {
  for (const locale of ['uk-UA', 'de-DE'] as const) {
    const { context, page } = await createLocalizedPage(browser, locale);
    await signInWithMagicLink(
      page,
      request,
      `profile-wave1-${locale}@example.com`,
    );
    await page.goto('/account');
    await waitForApplicationReady(page);

    await expect(page.getByRole('tablist')).toBeVisible();
    await expect(page.getByRole('tab')).toHaveCount(3);
    await expect(page.locator('#dashboard-mobile-nav')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^(Вийти|Abmelden)/ }),
    ).toBeVisible();

    await context.close();
  }
});

test('profile bottom navigation does not overlap logout on mobile viewport', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await signInWithMagicLink(page, request, 'profile-wave1-mobile@example.com');
  await openProfile(page);

  const logoutButton = page.getByRole('button', {
    name: 'Sign out',
    exact: true,
  });
  const bottomNav = page.locator('#dashboard-mobile-nav');

  await logoutButton.scrollIntoViewIfNeeded();
  await expect(logoutButton).toBeVisible();

  const logoutBox = await logoutButton.boundingBox();
  const navBox = await bottomNav.boundingBox();
  assertBoxesClear(logoutBox, navBox);
});

function assertBoxesClear(
  contentBox: { y: number; height: number } | null,
  navBox: { y: number; height: number } | null,
) {
  expect(contentBox).not.toBeNull();
  expect(navBox).not.toBeNull();

  if (!contentBox || !navBox) {
    return;
  }

  expect(contentBox.y + contentBox.height).toBeLessThanOrEqual(navBox.y + 1);
}

test('app theme lives on settings and exposes only light and dark', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, 'profile-wave1-theme@example.com');
  await openProfile(page);

  await expect(page.getByRole('group', { name: 'App theme' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'System' })).toHaveCount(0);

  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/account\/settings$/);
  await expect(page.getByRole('group', { name: 'App theme' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Light' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dark' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'System' })).toHaveCount(0);
});

test('legacy system theme preference resolves to dark on settings', async ({
  page,
  request,
}) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, 'system');
  }, THEME_STORAGE_KEY);

  await signInWithMagicLink(
    page,
    request,
    'profile-wave1-theme-legacy@example.com',
  );
  await page.goto('/account/settings');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('button', { name: 'Dark', pressed: true }),
  ).toBeVisible();
  await expect(
    page.evaluate(
      (storageKey) => window.localStorage.getItem(storageKey),
      THEME_STORAGE_KEY,
    ),
  ).resolves.toBe('dark');
});

test('selecting light and dark themes persists preference', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-wave1-theme-persist@example.com',
  );
  await page.goto('/account/settings');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Light' }).click();
  await expect(
    page.getByRole('button', { name: 'Light', pressed: true }),
  ).toBeVisible();
  await expect(
    page.evaluate(
      (storageKey) => window.localStorage.getItem(storageKey),
      THEME_STORAGE_KEY,
    ),
  ).resolves.toBe('light');
  await expect(page.locator('html')).toHaveClass(/light/);

  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(
    page.getByRole('button', { name: 'Dark', pressed: true }),
  ).toBeVisible();
  await expect(
    page.evaluate(
      (storageKey) => window.localStorage.getItem(storageKey),
      THEME_STORAGE_KEY,
    ),
  ).resolves.toBe('dark');
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('profile light theme keeps disabled rows and logout readable', async ({
  page,
  request,
}) => {
  await page.addInitScript((storageKey) => {
    window.localStorage.setItem(storageKey, 'light');
  }, THEME_STORAGE_KEY);

  await signInWithMagicLink(
    page,
    request,
    'profile-wave1-light-theme@example.com',
  );
  await page.goto('/account');
  await waitForApplicationReady(page);
  await expect(page.locator('html')).toHaveClass(/light/);

  const disabledRow = page
    .getByText('Coming later')
    .first()
    .locator('xpath=ancestor::div[@aria-disabled="true"][1]');
  await expect(disabledRow).toBeVisible();
  await expect(disabledRow).toHaveCSS('opacity', '1');

  const logoutButton = page.getByRole('button', {
    name: 'Sign out',
    exact: true,
  });
  await expect(logoutButton).toBeVisible();
  await expect(logoutButton).toHaveClass(/text-rose-800/);
  await expect(logoutButton).toHaveClass(/bg-rose-50/);

  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(
    page.getByRole('button', { name: 'Light', pressed: true }),
  ).toBeVisible();
});

test('sign out everywhere waits for confirmation and cancel keeps sessions', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-wave1-revoke-all-cancel@example.com',
  );
  await page.goto('/account/security/sessions');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'Sign out everywhere' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByText(
      'All active sessions will be ended, including this one. You will need to confirm sign-in by email to sign in again.',
    ),
  ).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/account\/security\/sessions$/);

  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  expect(await sessionResponse.json()).not.toBeNull();
});
