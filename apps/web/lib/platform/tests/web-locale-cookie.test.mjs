import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createWebLocaleCookieWriteOptions,
  parseWebLocaleCookieValue,
  readRequestPresentationContextFromStores,
  resolveWebLocaleCookieSecureFromProtocol,
  WEB_LOCALE_COOKIE_MAX_AGE_SECONDS,
  WEB_LOCALE_COOKIE_NAME,
  WEB_LOCALE_COOKIE_PATH,
} from '../web-locale-cookie.ts';

test('locale cookie name and writer options are centralized', () => {
  const options = createWebLocaleCookieWriteOptions(true);

  assert.equal(WEB_LOCALE_COOKIE_NAME, 'du-web-locale');
  assert.equal(WEB_LOCALE_COOKIE_PATH, '/');
  assert.equal(WEB_LOCALE_COOKIE_MAX_AGE_SECONDS, 60 * 60 * 24 * 365);
  assert.deepEqual(options, {
    httpOnly: true,
    maxAge: WEB_LOCALE_COOKIE_MAX_AGE_SECONDS,
    path: '/',
    sameSite: 'lax',
    secure: true,
  });
});

test('cookie parser accepts only exact canonical locales', () => {
  assert.equal(parseWebLocaleCookieValue('de-DE'), 'de-DE');
  assert.equal(parseWebLocaleCookieValue('de'), null);
  assert.equal(parseWebLocaleCookieValue('en-US'), null);
  assert.equal(parseWebLocaleCookieValue('garbage'), null);
});

test('HTTPS forwarded proto enables Secure; local HTTP does not', () => {
  assert.equal(resolveWebLocaleCookieSecureFromProtocol('https'), true);
  assert.equal(resolveWebLocaleCookieSecureFromProtocol('https, http'), true);
  assert.equal(
    resolveWebLocaleCookieSecureFromProtocol('http', {
      NODE_ENV: 'production',
    }),
    false,
  );
});

test('missing proto is Secure in production and HTTP-capable for local E2E', () => {
  assert.equal(
    resolveWebLocaleCookieSecureFromProtocol(undefined, {
      NODE_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    resolveWebLocaleCookieSecureFromProtocol(null, {
      AUTH_RUNTIME_ENV: 'e2e',
      NODE_ENV: 'production',
    }),
    false,
  );
  assert.equal(
    resolveWebLocaleCookieSecureFromProtocol(undefined, {
      NODE_ENV: 'development',
    }),
    false,
  );
});

test('request stores expose cookie locale without failing on garbage', () => {
  const context = readRequestPresentationContextFromStores(
    { get: (name) => (name === 'accept-language' ? 'ru-RU' : null) },
    {
      get: (name) =>
        name === WEB_LOCALE_COOKIE_NAME ? { value: '%%%' } : undefined,
    },
  );

  assert.equal(context.acceptLanguage, 'ru-RU');
  assert.equal(context.cookieLocale, '%%%');
});
