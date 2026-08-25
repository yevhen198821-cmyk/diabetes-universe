import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));

const menuSource = readFileSync(
  join(currentDirectory, 'profile-menu.tsx'),
  'utf8',
);
const settingsSource = readFileSync(
  join(currentDirectory, 'profile-settings-panel.tsx'),
  'utf8',
);
const sessionManagerSource = readFileSync(
  join(currentDirectory, '../auth/session-manager.tsx'),
  'utf8',
);
const mobileNavSource = readFileSync(
  join(currentDirectory, '../dashboard/dashboard-mobile-nav.tsx'),
  'utf8',
);

test('profile menu no longer renders app theme controls', () => {
  assert.doesNotMatch(menuSource, /ProfileThemeControl/);
  assert.doesNotMatch(menuSource, /ProfileMenuThemeRow/);
});

test('settings panel renders app theme controls', () => {
  assert.match(settingsSource, /ProfileThemeControl/);
  assert.match(settingsSource, /labels\.settings\.theme/);
});

test('sign out everywhere uses restrained destructive styling', () => {
  assert.match(sessionManagerSource, /confirmRevokeAllConfirm/);
  assert.match(
    sessionManagerSource,
    /bg-transparent[\s\S]*labels\.revokeAllPending : labels\.revokeAll/,
  );
});

test('sign out everywhere requires confirmation before form submit', () => {
  assert.match(sessionManagerSource, /setAllConfirmOpen\(true\)/);
  assert.match(
    sessionManagerSource,
    /allFormRef\.current\?\.requestSubmit\(\)/,
  );
  assert.match(sessionManagerSource, /SessionConfirmDialog/);
});

test('bottom navigation source remains unchanged in this polish scope', () => {
  assert.match(mobileNavSource, /href="\/account"/);
  assert.match(mobileNavSource, /grid-cols-3/);
  assert.match(mobileNavSource, /id="dashboard-mobile-nav"/);
});
