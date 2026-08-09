import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('sign-in page renders branded email entry', async ({ page }) => {
  await page.goto('/auth');

  await expect(
    page.getByRole('heading', { name: 'Вход в аккаунт' }),
  ).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Продолжить' })).toBeVisible();
});

test('magic link request navigates to check-email without exposing provider errors', async ({
  page,
}) => {
  await page.goto('/auth');
  await page.getByLabel('Email').fill('p6a-e2e@example.com');
  await page.getByRole('button', { name: 'Продолжить' }).click();

  await expect(page).toHaveURL(/\/auth\/check-email/);
  await expect(
    page.getByRole('heading', { name: 'Проверьте почту' }),
  ).toBeVisible();
  await expect(page.getByText('p6a-e2e@example.com')).toBeVisible();
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
  await page.goto('/');
  await page.goto('/auth');
  await page.getByLabel('Email').fill('p6a-verified@example.com');
  await page.getByRole('button', { name: 'Продолжить' }).click();
  await expect(page).toHaveURL(/\/auth\/check-email/);

  const fixtureResponse = await request.get('/api/auth/test/last-magic-link');
  expect(fixtureResponse.ok()).toBeTruthy();
  const fixture = (await fixtureResponse.json()) as { url: string | null };
  assert(fixture.url);

  await page.goto(fixture.url!, { waitUntil: 'load' });
  await page.waitForURL(/\/account/, { timeout: 10_000 });

  const sessionResponse = await page.request.get('/api/auth/get-session');
  expect(sessionResponse.ok()).toBeTruthy();
  const session = (await sessionResponse.json()) as {
    user?: { email?: string };
  };
  expect(session.user?.email).toBe('p6a-verified@example.com');
});

function assert(value: unknown): asserts value {
  expect(value).toBeTruthy();
}
