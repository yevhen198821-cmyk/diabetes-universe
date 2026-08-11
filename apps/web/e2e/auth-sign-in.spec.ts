import { expect, test } from '@playwright/test';

import type { APIRequestContext, Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

async function signInWithMagicLink(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  await page.goto('/auth');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/auth\/check-email/);

  const fixtureResponse = await request.get('/api/auth/test/last-magic-link');
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = (await fixtureResponse.json()) as { url: string | null };
  assert(fixture.url);

  await page.goto(fixture.url!, { waitUntil: 'load' });
  await page.waitForURL(/\/account/, { timeout: 10_000 });
}

test('sign-in page renders passkey-first entry with email fallback', async ({
  page,
}) => {
  await page.goto('/auth');

  await expect(
    page.getByRole('heading', { name: 'Вход в аккаунт' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Войти с Passkey' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeVisible();
});

test('magic link request navigates to check-email without exposing provider errors', async ({
  page,
}) => {
  await page.goto('/auth');
  await page.getByLabel('Email').fill('p6b-e2e@example.com');
  await page.getByRole('button', { name: 'Продолжить' }).click();

  await expect(page).toHaveURL(/\/auth\/check-email/);
  await expect(
    page.getByRole('heading', { name: 'Проверьте почту' }),
  ).toBeVisible();
  await expect(page.getByText('p6b-e2e@example.com')).toBeVisible();
});

test('account route redirects unauthenticated users to sign-in', async ({
  page,
}) => {
  await page.goto('/account');

  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount/);
});

test('verified magic link fixture establishes authenticated session', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(page, request, 'p6b-verified@example.com');

  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  const session = (await sessionResponse.json()) as {
    user?: { email?: string };
  };
  expect(session.user?.email).toBe('p6b-verified@example.com');
});

test('user can enroll a passkey, revoke current session, and sign in with the passkey', async ({
  page,
  request,
}) => {
  await page.context().clearCookies();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('WebAuthn.enable');
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });

  await signInWithMagicLink(page, request, 'p6b-passkey@example.com');
  await page.goto('/account/security');
  await expect(
    page.getByRole('heading', { name: 'Безопасность входа' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Добавить Passkey' }).click();
  await expect(page.getByText('Passkey добавлен.')).toBeVisible();
  await expect(page.getByText('Мой Passkey')).toBeVisible();

  await page.goto('/account');
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await expect(page).toHaveURL(/\/auth$/);

  const signedOutSession = await page.request.get('/api/auth/get-session');
  expect(signedOutSession.ok()).toBeTruthy();
  expect(await signedOutSession.json()).toBeNull();

  await page.getByRole('button', { name: 'Войти с Passkey' }).click();
  await expect(page).toHaveURL(/\/account$/);

  const restoredSession = await page.request.get('/api/auth/get-session');
  const restored = (await restoredSession.json()) as {
    user?: { email?: string };
  };
  expect(restored.user?.email).toBe('p6b-passkey@example.com');
});

function assert(value: unknown): asserts value {
  expect(value).toBeTruthy();
}
