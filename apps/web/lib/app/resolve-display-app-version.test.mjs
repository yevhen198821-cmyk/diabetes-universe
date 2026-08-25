import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveDisplayAppVersion } from './resolve-display-app-version.ts';

test('resolveDisplayAppVersion hides placeholder version 0.0.0', () => {
  assert.equal(resolveDisplayAppVersion('0.0.0'), null);
});

test('resolveDisplayAppVersion hides empty and whitespace versions', () => {
  assert.equal(resolveDisplayAppVersion(''), null);
  assert.equal(resolveDisplayAppVersion('   '), null);
  assert.equal(resolveDisplayAppVersion(null), null);
  assert.equal(resolveDisplayAppVersion(undefined), null);
});

test('resolveDisplayAppVersion returns trimmed release versions', () => {
  assert.equal(resolveDisplayAppVersion(' 1.2.3 '), '1.2.3');
  assert.equal(resolveDisplayAppVersion('2026.03.15'), '2026.03.15');
});
