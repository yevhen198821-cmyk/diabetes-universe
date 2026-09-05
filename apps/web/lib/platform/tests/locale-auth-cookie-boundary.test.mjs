import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { WEB_LOCALE_COOKIE_NAME } from '../web-locale-cookie.ts';

test('sign-out does not clear the locale cookie', async () => {
  const signOutSource = await readFile(
    new URL('../../auth/account-security-actions.ts', import.meta.url),
    'utf8',
  );
  const cookieSource = await readFile(
    new URL('../web-locale-cookie.ts', import.meta.url),
    'utf8',
  );

  assert.match(cookieSource, new RegExp(WEB_LOCALE_COOKIE_NAME));
  assert.doesNotMatch(signOutSource, new RegExp(WEB_LOCALE_COOKIE_NAME));
  assert.doesNotMatch(signOutSource, /cookies\(\)\.delete/);
  assert.match(signOutSource, /signOutCurrentSession/);
});
