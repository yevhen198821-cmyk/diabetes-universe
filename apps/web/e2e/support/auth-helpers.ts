import {
  expect,
  type APIRequestContext,
  type Browser,
  type Page,
} from '@playwright/test';

export const CHROME_MAC_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const SAFARI_IPHONE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export async function signInWithMagicLink(
  page: Page,
  request: APIRequestContext,
  email: string,
  callbackPath = '/account',
) {
  const magicLinkFixtureUrl = `/api/auth/test/last-magic-link?email=${encodeURIComponent(
    email,
  )}`;
  const priorResponse = await request.get(magicLinkFixtureUrl);
  const priorFixture = (await priorResponse.json()) as { url: string | null };
  const priorUrl = priorFixture.url;

  await page.goto(`/auth?callback=${encodeURIComponent(callbackPath)}`);
  await page.getByLabel('Email').fill(email);
  await page
    .getByRole('button', {
      name: /^(Continue|Продолжить|Weiter|Продовжити)$/,
    })
    .click();
  await expect(page).toHaveURL(/\/auth\/check-email/);

  await expect
    .poll(async () => {
      const fixtureResponse = await request.get(magicLinkFixtureUrl);
      const fixture = (await fixtureResponse.json()) as { url: string | null };
      return Boolean(fixture.url && fixture.url !== priorUrl);
    })
    .toBe(true);

  const fixtureResponse = await request.get(magicLinkFixtureUrl);
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = (await fixtureResponse.json()) as {
    email: string | null;
    url: string | null;
  };
  assert(fixture.url);
  expect(fixture.email).toBe(email.trim().toLowerCase());

  await page.goto(fixture.url!, { waitUntil: 'load' });
  const escapedCallback = callbackPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await expect(page).toHaveURL(new RegExp(escapedCallback));
}

export async function readSessionId(page: Page): Promise<string | null> {
  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  const session = (await sessionResponse.json()) as {
    session?: { id?: string };
  } | null;

  return session?.session?.id ?? null;
}

export async function createLocalizedAuthContext(
  browser: Browser,
  userAgent: string,
) {
  return browser.newContext({
    userAgent,
    locale: 'en-GB',
    extraHTTPHeaders: {
      'Accept-Language': 'en-GB',
    },
  });
}

export async function createRussianAuthContext(
  browser: Browser,
  userAgent: string,
) {
  return browser.newContext({
    userAgent,
    locale: 'ru-RU',
    extraHTTPHeaders: {
      'Accept-Language': 'ru-RU',
    },
  });
}

export async function expectUnauthenticatedViaNavigation(page: Page) {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\?callback=(%2Faccount|\/account)/);
}

export async function expectAuthenticated(page: Page) {
  await page.goto('/account');
  await expect(page).not.toHaveURL(/\/auth/);

  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  const session = await sessionResponse.json();
  expect(session).not.toBeNull();
}

export async function expectUnauthenticated(page: Page) {
  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  expect(await sessionResponse.json()).toBeNull();

  await page.goto('/account');
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount/);
}

export async function gotoSessionsPage(page: Page) {
  await page.goto('/account/security/sessions');
  await expect(
    page.getByRole('heading', { level: 2, name: 'Active sessions' }),
  ).toBeVisible();
}

export async function confirmDialogAction(page: Page, actionName: string) {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: actionName }).click();
  await expect(dialog).toBeHidden();
}

export async function revokeOtherSessionByClientLabel(
  page: Page,
  clientLabel: string,
) {
  const sessionCard = page.locator('li').filter({ hasText: clientLabel });
  await sessionCard.getByRole('button', { name: 'End session' }).click();
  await confirmDialogAction(page, 'End session');
}

export async function signOutOtherSessions(page: Page) {
  await page.getByRole('button', { name: 'Sign out other sessions' }).click();
  await confirmDialogAction(page, 'Sign out other sessions');
}

export async function signOutEverywhere(page: Page) {
  await page.getByRole('button', { name: 'Sign out everywhere' }).click();
  await confirmDialogAction(page, 'Sign out everywhere');
}

export async function signOutCurrentSession(page: Page) {
  const currentCard = page.locator('li').filter({ hasText: 'Current session' });
  await currentCard
    .getByRole('button', { name: 'Sign out', exact: true })
    .click();
}

export async function markCurrentSessionStale(page: Page) {
  const response = await page.request.post(
    '/api/auth/test/stale-current-session',
  );
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { ok?: boolean };
  expect(body.ok).toBe(true);
}

export async function removeExistingPasskeys(page: Page) {
  await page.goto('/account/security');
  const passkeyRows = page.locator('section ul li');

  while ((await passkeyRows.count()) > 0) {
    const remaining = await passkeyRows.count();
    await page
      .getByRole('button', { name: 'Удалить', exact: true })
      .first()
      .click();
    await expect(passkeyRows).toHaveCount(remaining - 1);
  }
}

function assert(value: unknown): asserts value {
  expect(value).toBeTruthy();
}
