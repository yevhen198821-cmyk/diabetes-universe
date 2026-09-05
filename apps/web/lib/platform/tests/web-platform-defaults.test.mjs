import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WEB_PLATFORM_DEFAULT_LOCALE,
  WEB_PLATFORM_FALLBACK_POLICY,
} from '../web-platform-defaults.ts';

test('WEB_PLATFORM_DEFAULT_LOCALE remains the approved platform default en-GB', () => {
  assert.equal(WEB_PLATFORM_DEFAULT_LOCALE, 'en-GB');
});

test('resource fallback policy default locale stays en-GB separate from presentation default', () => {
  assert.equal(WEB_PLATFORM_FALLBACK_POLICY.defaultLocale, 'en-GB');
  assert.equal(
    WEB_PLATFORM_FALLBACK_POLICY.defaultLocale,
    WEB_PLATFORM_DEFAULT_LOCALE,
  );
  assert.deepEqual(
    [...WEB_PLATFORM_FALLBACK_POLICY.localeFallbackChain],
    ['en-GB'],
  );
});
