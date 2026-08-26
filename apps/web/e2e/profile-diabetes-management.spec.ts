import { expect, test } from './support/test';

import { signInWithMagicLink } from './support/auth-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const THEME_STORAGE_KEY = 'du-ui-theme';

async function openProfile(page: import('./support/test').Page) {
  await page.goto('/account');
  await waitForApplicationReady(page);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Profile' }),
  ).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('profile menu contains diabetes management entry', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-diabetes-menu@example.com');
  await openProfile(page);

  await expect(
    page.getByRole('link', { name: /Diabetes management/i }),
  ).toBeVisible();
});

test('unauthenticated diabetes route redirects to auth callback', async ({
  page,
}) => {
  await page.goto('/account/diabetes');
  await expect(page).toHaveURL(/\/auth\?callback=%2Faccount%2Fdiabetes/);
});

test('diabetes management screen renders unconfigured glucose unit state', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await signInWithMagicLink(
    page,
    request,
    'profile-diabetes-unconfigured@example.com',
  );
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  await expect(
    page.getByRole('heading', { name: 'Diabetes management', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Not selected')).toBeVisible();

  const mmolButton = page.getByRole('button', { name: 'mmol/L', exact: true });
  const mgButton = page.getByRole('button', { name: 'mg/dL', exact: true });
  await expect(mmolButton).toHaveAttribute('aria-pressed', 'false');
  await expect(mgButton).toHaveAttribute('aria-pressed', 'false');
});

test('selecting glucose unit saves via PATCH and updates pressed state', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await signInWithMagicLink(page, request, 'profile-diabetes-unit@example.com');
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  const patchPromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/medical/me/diabetes-settings') &&
      response.request().method() === 'PATCH',
  );

  await page.getByRole('button', { name: 'mmol/L', exact: true }).click();
  const patchResponse = await patchPromise;
  expect(patchResponse.ok()).toBeTruthy();
  await expect(
    page.getByRole('button', { name: 'mmol/L', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('target editor validates bounds and saves canonical mmol/L payload', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(
    page,
    request,
    'profile-diabetes-target@example.com',
  );
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'mmol/L', exact: true }).click();
  await page.getByRole('button', { name: /Target range/i }).click();
  const targetDialog = page.getByRole('dialog', { name: 'Target range' });
  await expect(targetDialog).toBeVisible();

  await targetDialog.getByLabel('Lower limit').fill('10');
  await targetDialog.getByLabel('Upper limit').fill('10');
  await expect(targetDialog.getByLabel('Lower limit')).toHaveValue('10');
  await expect(targetDialog.getByLabel('Upper limit')).toHaveValue('10');
  await targetDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    targetDialog.getByRole('alert'),
  ).toContainText('The lower limit must be less than the upper limit.');

  await targetDialog.getByLabel('Lower limit').fill('4.0');
  await targetDialog.getByLabel('Upper limit').fill('10.0');

  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/medical/me/glucose-target-profile') &&
      response.request().method() === 'PUT',
  );
  await targetDialog.getByRole('button', { name: 'Save', exact: true }).click();
  const putResponse = await putPromise;
  expect(putResponse.ok()).toBeTruthy();

  const payload = (await putResponse.request().postDataJSON()) as {
    defaultRange: { lowMmolPerL: number; highMmolPerL: number };
  };
  expect(payload.defaultRange.lowMmolPerL).toBe(4);
  expect(payload.defaultRange.highMmolPerL).toBe(10);
  await expect(page.getByText('4.0–10.0 mmol/L')).toBeVisible();
});

test('remove target requires confirmation and clears configured range', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-diabetes-remove-target@example.com',
  );
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  await page.getByRole('button', { name: 'mmol/L', exact: true }).click();
  await page.getByRole('button', { name: /Target range/i }).click();
  const targetDialog = page.getByRole('dialog', { name: 'Target range' });
  await targetDialog.getByLabel('Lower limit').fill('4.0');
  await targetDialog.getByLabel('Upper limit').fill('10.0');
  await targetDialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('4.0–10.0 mmol/L')).toBeVisible();

  await page.getByRole('button', { name: 'Remove target range' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Remove target range?' }),
  ).toContainText('Historical glucose measurements are not deleted');
  await page
    .getByRole('dialog', { name: 'Remove target range?' })
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  await expect(page.getByText('4.0–10.0 mmol/L')).toBeVisible();

  const deletePromise = page.waitForResponse(
    (response) =>
      response.url().includes('/api/v1/medical/me/glucose-target-profile') &&
      response.request().method() === 'DELETE',
  );
  await page.getByRole('button', { name: 'Remove target range' }).click();
  await page
    .getByRole('dialog', { name: 'Remove target range?' })
    .getByRole('button', { name: 'Remove range' })
    .click();
  const deleteResponse = await deletePromise;
  expect(deleteResponse.ok()).toBeTruthy();
  await expect(page.getByText('Not set')).toBeVisible();
});

test('diabetes management screen respects light and dark themes at mobile widths', async ({
  page,
  request,
}) => {
  await signInWithMagicLink(
    page,
    request,
    'profile-diabetes-theme@example.com',
  );

  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/account/diabetes');
    await waitForApplicationReady(page);
    await expect(
      page.getByRole('heading', { name: 'Diabetes management', exact: true }),
    ).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, 'light'],
  );
  await page.reload();
  await waitForApplicationReady(page);
  await expect(page.locator('html')).not.toHaveClass(/dark/);

  await page.evaluate(
    ([key, value]) => localStorage.setItem(key, value),
    [THEME_STORAGE_KEY, 'dark'],
  );
  await page.reload();
  await waitForApplicationReady(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
});

test('bottom navigation remains active on diabetes management route', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInWithMagicLink(page, request, 'profile-diabetes-nav@example.com');
  await page.goto('/account/diabetes');
  await waitForApplicationReady(page);

  await expect(
    page
      .locator('#dashboard-mobile-nav')
      .getByRole('link', { name: 'Account' }),
  ).toHaveAttribute('aria-current', 'page');
});
