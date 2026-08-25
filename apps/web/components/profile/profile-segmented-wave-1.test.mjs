import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { createProfileUserCardModel } from './profile-user-model.ts';

const shellSource = readFileSync(
  fileURLToPath(new URL('./profile-shell.tsx', import.meta.url)),
  'utf8',
);
const segmentedControlSource = readFileSync(
  fileURLToPath(new URL('../shared/segmented-control.tsx', import.meta.url)),
  'utf8',
);
const mobileNavSource = readFileSync(
  fileURLToPath(
    new URL('../dashboard/dashboard-mobile-nav.tsx', import.meta.url),
  ),
  'utf8',
);
const accountLayoutSource = readFileSync(
  fileURLToPath(new URL('../../app/account/layout.tsx', import.meta.url)),
  'utf8',
);
const accountPageSource = readFileSync(
  fileURLToPath(new URL('../../app/account/page.tsx', import.meta.url)),
  'utf8',
);
const menuSource = readFileSync(
  fileURLToPath(new URL('./profile-menu.tsx', import.meta.url)),
  'utf8',
);
const settingsPanelSource = readFileSync(
  fileURLToPath(new URL('./profile-settings-panel.tsx', import.meta.url)),
  'utf8',
);

test('profile shell uses segmented navigation, skip link, and account mobile nav', () => {
  assert.match(shellSource, /SegmentedControl/);
  assert.match(shellSource, /SkipLink/);
  assert.match(shellSource, /DashboardMobileNav activeTab="account"/);
  assert.match(shellSource, /id="main-content"/);
});

test('segmented control meets accessibility and touch-target requirements', () => {
  assert.match(segmentedControlSource, /role="tablist"/);
  assert.match(segmentedControlSource, /role="tab"/);
  assert.match(segmentedControlSource, /aria-selected=/);
  assert.match(segmentedControlSource, /min-h-11/);
  assert.match(segmentedControlSource, /line-clamp-2/);
});

test('account layout wraps routes in profile shell after auth check', () => {
  assert.match(accountLayoutSource, /getAuthenticatedPrincipal/);
  assert.match(accountLayoutSource, /ProfileShell/);
});

test('account profile route renders user card, menu, and logout', () => {
  assert.match(accountPageSource, /ProfileProfileSegment/);
  assert.doesNotMatch(accountPageSource, /Диабет/);
});

test('profile menu keeps disabled rows for unavailable actions', () => {
  assert.match(menuSource, /ProfileMenuDisabledRow/);
  assert.match(menuSource, /aria-disabled="true"/);
  assert.doesNotMatch(menuSource, /ProfileThemeControl/);
  assert.match(menuSource, /ProfileMenuAboutRow/);
});

test('settings panel contains app theme controls', () => {
  assert.match(settingsPanelSource, /ProfileThemeControl/);
  assert.match(settingsPanelSource, /labels\.settings\.theme/);
});

test('mobile nav supports active account tab state', () => {
  assert.match(mobileNavSource, /activeTab === 'account'/);
  assert.match(mobileNavSource, /aria-current=\{activeTab === 'account'/);
});

test('profile user card model never exposes medical profile fields', () => {
  const model = createProfileUserCardModel(
    {
      accountId: 'acc-test',
      displayName: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
    },
    { fallbackName: 'Account' },
    'en-GB',
  );

  assert.equal('diabetesType' in model, false);
  assert.equal('diagnosisYear' in model, false);
});
