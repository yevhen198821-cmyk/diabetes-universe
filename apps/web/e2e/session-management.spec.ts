import { expect, test } from '@playwright/test';

import {
  CHROME_MAC_USER_AGENT,
  createLocalizedAuthContext,
  expectAuthenticated,
  expectUnauthenticated,
  createRussianAuthContext,
  expectUnauthenticatedViaNavigation,
  gotoSessionsPage,
  markCurrentSessionStale,
  readSessionId,
  SAFARI_IPHONE_USER_AGENT,
  signInWithMagicLink,
  signOutCurrentSession,
  signOutEverywhere,
  signOutOtherSessions,
} from './support/auth-helpers';

test.describe.configure({ mode: 'serial' });

test.describe('P6c session management', () => {
  test('revokes another browser session while keeping the current session active', async ({
    browser,
    request,
  }) => {
    const email = 'p6c-revoke-other-session@example.com';
    const contextA = await createLocalizedAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const contextB = await createLocalizedAuthContext(
      browser,
      SAFARI_IPHONE_USER_AGENT,
    );
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signInWithMagicLink(pageA, request, email);
    await signInWithMagicLink(pageB, request, email);

    const sessionIdA = await readSessionId(pageA);
    const sessionIdB = await readSessionId(pageB);
    expect(sessionIdA).toBeTruthy();
    expect(sessionIdB).toBeTruthy();
    expect(sessionIdA).not.toBe(sessionIdB);

    await gotoSessionsPage(pageA);
    await expect(pageA.getByText('Current session')).toBeVisible();
    await expect(
      pageA.getByRole('button', { name: 'Sign out', exact: true }),
    ).toHaveCount(1);
    await expect(
      pageA.getByRole('button', { name: 'End session', exact: true }),
    ).toHaveCount(1);

    await pageA
      .getByRole('button', { name: 'End session', exact: true })
      .click();
    await pageA
      .getByRole('dialog')
      .getByRole('button', { name: 'End session', exact: true })
      .click();

    await expect(
      pageA.getByRole('button', { name: 'End session', exact: true }),
    ).toHaveCount(0);
    await expect(pageA.getByText('Current session')).toBeVisible();
    await expect(
      pageA.getByText('No other active sessions were found.'),
    ).toBeVisible();

    await expectUnauthenticated(pageB);
    await expectAuthenticated(pageA);

    await contextA.close();
    await contextB.close();
  });

  test('revoked session navigates to auth without proxy redirect loop', async ({
    browser,
    request,
  }) => {
    const email = 'p6c-revoked-navigation@example.com';
    const contextA = await createLocalizedAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const contextB = await createLocalizedAuthContext(
      browser,
      SAFARI_IPHONE_USER_AGENT,
    );
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signInWithMagicLink(pageA, request, email);
    await signInWithMagicLink(pageB, request, email);

    await gotoSessionsPage(pageA);
    await pageA
      .getByRole('button', { name: 'End session', exact: true })
      .click();
    await pageA
      .getByRole('dialog')
      .getByRole('button', { name: 'End session', exact: true })
      .click();

    await expectUnauthenticatedViaNavigation(pageB);
    await pageB.goto('/auth');
    await expect(
      pageB.getByRole('heading', { name: 'Вход в аккаунт' }),
    ).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test('renders a single-locale Russian sessions surface for ru-RU requests', async ({
    browser,
    request,
  }) => {
    const context = await createRussianAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const page = await context.newPage();

    await signInWithMagicLink(page, request, 'p6c-ru-locale@example.com');
    await page.goto('/account/security/sessions');

    await expect(
      page.getByRole('heading', { level: 2, name: 'Активные сессии' }),
    ).toBeVisible();
    await expect(page.getByText('Current session')).toHaveCount(0);
    await expect(page.getByText('Текущая сессия')).toBeVisible();
    await expect(page.getByText('Active sessions')).toHaveCount(0);

    await context.close();
  });

  test('signs out other sessions while keeping the current session active', async ({
    browser,
    request,
  }) => {
    const email = 'p6c-sign-out-others@example.com';
    const contextA = await createLocalizedAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const contextB = await createLocalizedAuthContext(
      browser,
      SAFARI_IPHONE_USER_AGENT,
    );
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signInWithMagicLink(pageA, request, email);
    await signInWithMagicLink(pageB, request, email);

    await gotoSessionsPage(pageA);
    await signOutOtherSessions(pageA);
    await expect(pageA.getByRole('status')).toContainText(
      'Действие выполнено.',
    );
    await expect(
      pageA.getByRole('button', { name: 'End session', exact: true }),
    ).toHaveCount(0);
    await expect(pageA.getByText('Current session')).toBeVisible();

    await expectUnauthenticated(pageB);
    await expectAuthenticated(pageA);

    await contextA.close();
    await contextB.close();
  });

  test('signs out everywhere and terminates all authenticated sessions', async ({
    browser,
    request,
  }) => {
    const email = 'p6c-sign-out-everywhere@example.com';
    const contextA = await createLocalizedAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const contextB = await createLocalizedAuthContext(
      browser,
      SAFARI_IPHONE_USER_AGENT,
    );
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signInWithMagicLink(pageA, request, email);
    await signInWithMagicLink(pageB, request, email);

    await gotoSessionsPage(pageA);
    await signOutEverywhere(pageA);
    await expect(pageA).toHaveURL(/\/auth$/);

    await expectUnauthenticated(pageA);
    await expectUnauthenticated(pageB);

    await contextA.close();
    await contextB.close();
  });

  test('signs out from the current session row', async ({ page, request }) => {
    await signInWithMagicLink(
      page,
      request,
      'p6c-current-sign-out@example.com',
    );

    await gotoSessionsPage(page);
    await signOutCurrentSession(page);
    await expect(page).toHaveURL(/\/auth$/);
    await expectUnauthenticated(page);
  });

  test('allows stale sessions to list sessions but requires re-auth before destructive actions', async ({
    page,
    request,
  }) => {
    const email = 'p6c-fresh-auth@example.com';
    await signInWithMagicLink(
      page,
      request,
      email,
      '/account/security/sessions',
    );

    await gotoSessionsPage(page);
    await markCurrentSessionStale(page);

    await page.reload();
    await expect(
      page.getByRole('heading', { level: 2, name: 'Active sessions' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Sign out everywhere' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign out everywhere' })
      .click();

    const freshAuthAlert = page.getByRole('alert').filter({
      hasText: 'Confirm sign-in and try the action again.',
    });
    await expect(freshAuthAlert).toBeVisible();
    await freshAuthAlert
      .getByRole('button', { name: 'Confirm sign-in' })
      .click();
    await expect(page).toHaveURL(
      /\/auth\?callback=(%2Faccount%2Fsecurity%2Fsessions|\/account\/security\/sessions)/,
    );

    await signInWithMagicLink(
      page,
      request,
      email,
      '/account/security/sessions',
    );
    await expect(page).toHaveURL(/\/account\/security\/sessions/);
    await gotoSessionsPage(page);
    await expect(page.getByText('Current session')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Sign out everywhere', exact: true }),
    ).toBeVisible();
  });

  test('does not expose sensitive session metadata in the sessions UI', async ({
    browser,
    request,
  }) => {
    const email = 'p6c-privacy@example.com';
    const contextA = await createLocalizedAuthContext(
      browser,
      CHROME_MAC_USER_AGENT,
    );
    const contextB = await createLocalizedAuthContext(
      browser,
      SAFARI_IPHONE_USER_AGENT,
    );
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    await signInWithMagicLink(pageA, request, email);
    await signInWithMagicLink(pageB, request, email);

    await gotoSessionsPage(pageA);
    const pageText = (await pageA.locator('main').innerText()).toLowerCase();

    expect(pageText).not.toMatch(/\buserid\b/);
    expect(pageText).not.toMatch(/\baccountid\b/);
    expect(pageText).not.toMatch(/\bip address\b/);
    expect(pageText).not.toMatch(/\bfingerprint\b/);
    expect(pageText).not.toMatch(/mozilla\/5\.0/);
    await expect(
      pageA.locator('input[name="sessionId"][type="hidden"]'),
    ).toHaveCount(1);
    await expect(pageA.getByText(/session-current|session-other/i)).toHaveCount(
      0,
    );

    await contextA.close();
    await contextB.close();
  });
});
