import { join } from 'node:path';

import { expect, test } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const AVATAR_FIXTURE_PATH = join(
  process.cwd(),
  'apps/web/e2e/fixtures/profile-avatar-sample.png',
);

test.describe.configure({ mode: 'serial' });

test('profile avatar upload, replace, persistence, and removal', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-avatar-flow@example.com');
  await page.goto('/account');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: 'Profile photo' }),
  ).toBeVisible();

  await page.locator('input[type="file"]').setInputFiles(AVATAR_FIXTURE_PATH);
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(profileAvatarImage(page)).toBeVisible();

  const avatarSrc = await profileAvatarImage(page).getAttribute('src');
  assertAvatarSrc(avatarSrc);

  await page.reload();
  await waitForApplicationReady(page);
  await expect(profileAvatarImage(page)).toBeVisible();

  await page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles(AVATAR_FIXTURE_PATH);
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();
  await expect(profileAvatarImage(page)).toBeVisible();

  await page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .click();
  await page.getByRole('button', { name: 'Remove photo', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(profileAvatarImage(page)).toHaveCount(0);
});

test('profile avatar rejects invalid file type in dialog', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-avatar-invalid@example.com',
  );
  await page.goto('/account');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .click();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not an image'),
  });
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();

  await expect(page.getByText('Use a JPG, PNG, or WebP image.')).toBeVisible();
});

test('profile avatar upload works on mobile viewport', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await signInWithMagicLink(page, request, 'profile-avatar-mobile@example.com');
  await page.goto('/account');
  await waitForApplicationReady(page);

  await page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .click();
  await page.locator('input[type="file"]').setInputFiles(AVATAR_FIXTURE_PATH);
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();

  await expect(profileAvatarImage(page)).toBeVisible();
  const box = await page.locator('#dashboard-mobile-nav').boundingBox();
  expect(box).not.toBeNull();
});

test('unauthenticated avatar API returns 401', async ({ request }) => {
  const response = await request.delete('/api/v1/identity/me/avatar');
  expect(response.status()).toBe(401);
});

function profileAvatarImage(page: import('./support/test').Page) {
  return page
    .getByRole('button', { name: 'Change profile photo', exact: true })
    .locator('img[alt="Profile avatar"]');
}

function assertAvatarSrc(value: string | null) {
  expect(value).toBeTruthy();
  expect(value).toMatch(/\/api\/v1\/identity\/me\/avatar\?v=/);
}
