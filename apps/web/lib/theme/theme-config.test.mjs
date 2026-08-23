import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolveThemeClass,
  themeInitScript,
  THEME_STORAGE_KEY,
} from './theme-config.ts';

test('resolveThemeClass maps explicit and system preferences', () => {
  assert.equal(resolveThemeClass('light', true), 'light');
  assert.equal(resolveThemeClass('dark', false), 'dark');
  assert.equal(resolveThemeClass('system', true), 'dark');
  assert.equal(resolveThemeClass('system', false), 'light');
});

test('theme init script uses storage key and applies html class', () => {
  assert.ok(themeInitScript.includes(THEME_STORAGE_KEY));
  assert.match(themeInitScript, /classList\.remove\('light','dark'\)/);
});
