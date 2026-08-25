import { expect, test } from '@playwright/test';

import {
  removeExistingPasskeys,
  signInWithMagicLink,
} from './support/auth-helpers';

test.describe.configure({ mode: 'serial' });

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
  await page.context().credentials.install();
  await page.context().clearCookies();

  await signInWithMagicLink(page, request, 'p6b-passkey@example.com');
  await removeExistingPasskeys(page);
  await page.goto('/account/security');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile' }),
  ).toBeVisible();
  await expect(
    page.getByRole('tab', { name: 'Security', selected: true }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Добавить Passkey' }).click();
  await expect(page.getByText('Passkey добавлен.')).toBeVisible();
  await expect(page.getByText('Мой Passkey')).toHaveCount(1);

  await page.goto('/account');
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
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
