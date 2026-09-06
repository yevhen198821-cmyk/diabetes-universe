import { expect, test } from './support/test';

import {
  signInWithMagicLink,
  signOutFromAccount,
} from './support/auth-helpers';
import {
  saveGlucoseQuickAdd,
  selectGlucoseUnitIfRequired,
} from './support/glucose-quick-add-helpers';
import {
  readActiveTimelineStoredEvents,
  waitForTimelineOwnershipReady,
} from './support/timeline-indexeddb-helpers';
import { waitForApplicationReady } from './support/wait-for-application-ready';

const ACCOUNT_A_EMAIL = 'remediation-0a-account-a@example.com';
const ACCOUNT_B_EMAIL = 'remediation-0a-account-b@example.com';
const ACCOUNT_A_MARKER = '11.17';
const ACCOUNT_B_MARKER = '12.28';

async function openOwnedDashboard(page: import('./support/test').Page) {
  await page.goto('/');
  await waitForApplicationReady(page);
  await waitForTimelineOwnershipReady(page);
}

async function recordMarkerGlucose(
  page: import('./support/test').Page,
  value: string,
) {
  await page.getByRole('button', { name: 'Quick add: Glucose' }).click();
  await selectGlucoseUnitIfRequired(page);
  await page.getByLabel('Glucose level').fill(value);
  await saveGlucoseQuickAdd(page);
}

async function expectLastGlucoseValue(
  page: import('./support/test').Page,
  value: string,
) {
  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText(value, {
      exact: true,
    }),
  ).toBeVisible();
}

async function expectLastGlucoseAbsent(
  page: import('./support/test').Page,
  value: string,
) {
  await expect(
    page.getByRole('region', { name: 'Last glucose' }).getByText(value, {
      exact: true,
    }),
  ).toHaveCount(0);
}

async function storedMarkerValues(page: import('./support/test').Page) {
  const events = await readActiveTimelineStoredEvents(page);
  return events
    .filter((event) => event.kind === 'glucose')
    .map((event) => String(event.concentrationMmolPerL));
}

test.describe('Remediation 0A local Timeline account isolation', () => {
  test.use({
    extraHTTPHeaders: { 'Accept-Language': 'en-GB' },
    locale: 'en-GB',
  });

  test('F-01 two real accounts cannot read each other local medical Timeline', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(page, request, ACCOUNT_A_EMAIL);
    await openOwnedDashboard(page);
    await expect(
      page.locator('[data-timeline-ownership="authenticated"]'),
    ).toBeVisible();

    await recordMarkerGlucose(page, ACCOUNT_A_MARKER);
    await expectLastGlucoseValue(page, ACCOUNT_A_MARKER);
    expect(await storedMarkerValues(page)).toContain(ACCOUNT_A_MARKER);

    await signOutFromAccount(page);
    await openOwnedDashboard(page);
    await expect(
      page.locator('[data-timeline-ownership="anonymous"]'),
    ).toBeVisible();
    await expectLastGlucoseAbsent(page, ACCOUNT_A_MARKER);
    await expectLastGlucoseAbsent(page, ACCOUNT_B_MARKER);
    expect(await storedMarkerValues(page)).not.toContain(ACCOUNT_A_MARKER);

    await signInWithMagicLink(page, request, ACCOUNT_B_EMAIL);
    await openOwnedDashboard(page);
    await expect(
      page.locator('[data-timeline-ownership="authenticated"]'),
    ).toBeVisible();
    await expectLastGlucoseAbsent(page, ACCOUNT_A_MARKER);
    expect(await storedMarkerValues(page)).not.toContain(ACCOUNT_A_MARKER);

    await recordMarkerGlucose(page, ACCOUNT_B_MARKER);
    await expectLastGlucoseValue(page, ACCOUNT_B_MARKER);
    await expectLastGlucoseAbsent(page, ACCOUNT_A_MARKER);
    expect(await storedMarkerValues(page)).toContain(ACCOUNT_B_MARKER);
    expect(await storedMarkerValues(page)).not.toContain(ACCOUNT_A_MARKER);

    await signOutFromAccount(page);
    await signInWithMagicLink(page, request, ACCOUNT_A_EMAIL);
    await openOwnedDashboard(page);
    await expectLastGlucoseValue(page, ACCOUNT_A_MARKER);
    await expectLastGlucoseAbsent(page, ACCOUNT_B_MARKER);
    expect(await storedMarkerValues(page)).toContain(ACCOUNT_A_MARKER);
    expect(await storedMarkerValues(page)).not.toContain(ACCOUNT_B_MARKER);
  });

  test('revoked session does not keep authenticated A records in the signed-out context', async ({
    page,
    request,
  }) => {
    await signInWithMagicLink(page, request, ACCOUNT_A_EMAIL);
    await openOwnedDashboard(page);
    await recordMarkerGlucose(page, ACCOUNT_A_MARKER);
    await expectLastGlucoseValue(page, ACCOUNT_A_MARKER);

    await signOutFromAccount(page);
    const sessionResponse = await page.request.get('/api/auth/get-session');
    expect(sessionResponse.ok()).toBeTruthy();
    expect(await sessionResponse.json()).toBeNull();

    await openOwnedDashboard(page);
    await expect(
      page.locator('[data-timeline-ownership="anonymous"]'),
    ).toBeVisible();
    await expectLastGlucoseAbsent(page, ACCOUNT_A_MARKER);
    expect(await storedMarkerValues(page)).not.toContain(ACCOUNT_A_MARKER);
  });
});
