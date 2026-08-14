import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { sessionManagerTranslationKeys } from './session-manager-labels.ts';

const SESSION_MANAGER_KEYS = Object.values(sessionManagerTranslationKeys);

test('session manager translation keys are canonical and non-empty in English resources', () => {
  for (const key of SESSION_MANAGER_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('session manager keys stay hierarchical under account namespace', () => {
  for (const key of SESSION_MANAGER_KEYS) {
    assert.match(key, /^account\.|^common\.actions\.cancel$/);
  }
});

test('account namespace remains in application preload scope', async () => {
  const { WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES } =
    await import('../../lib/platform/web-platform-defaults.ts');

  assert.deepEqual(WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES, [
    'common',
    'account',
    'dashboard',
    'timeline',
  ]);
});
