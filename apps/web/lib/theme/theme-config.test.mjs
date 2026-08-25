import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  normalizeStoredThemePreference,
  resolveThemeClass,
  themeInitScript,
  THEME_STORAGE_KEY,
} from './theme-config.ts';

const currentDirectory = fileURLToPath(new URL('.', import.meta.url));

test('normalizeStoredThemePreference exposes only light and dark', () => {
  assert.equal(normalizeStoredThemePreference('light'), 'light');
  assert.equal(normalizeStoredThemePreference('dark'), 'dark');
  assert.equal(normalizeStoredThemePreference('system'), 'dark');
  assert.equal(normalizeStoredThemePreference(null), 'dark');
  assert.equal(normalizeStoredThemePreference(undefined), 'dark');
});

test('resolveThemeClass ignores legacy system preference', () => {
  assert.equal(resolveThemeClass('light'), 'light');
  assert.equal(resolveThemeClass('dark'), 'dark');
  assert.equal(resolveThemeClass('system'), 'dark');
});

test('theme init script migrates legacy system preference to dark', () => {
  assert.ok(themeInitScript.includes(THEME_STORAGE_KEY));
  assert.match(themeInitScript, /classList\.remove\('light','dark'\)/);
  assert.match(themeInitScript, /p==='system'/);
  assert.match(themeInitScript, /localStorage\.setItem\(k,'dark'\)/);
});

test('profile theme control exposes only light and dark options', () => {
  const source = readFileSync(
    join(
      currentDirectory,
      '../../components/profile/profile-theme-control.tsx',
    ),
    'utf8',
  );

  assert.match(source, /grid-cols-2/);
  assert.match(source, /id: 'light'/);
  assert.match(source, /id: 'dark'/);
  assert.doesNotMatch(source, /system/);
});
