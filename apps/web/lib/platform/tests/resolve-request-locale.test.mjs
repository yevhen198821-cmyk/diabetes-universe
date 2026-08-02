import assert from 'node:assert/strict';
import test from 'node:test';

import {
  parseAcceptLanguage,
  resolveLanguageFromLocale,
  resolveRequestLocale,
} from '../resolve-request-locale.ts';
import { WEB_PLATFORM_DEFAULT_LOCALE } from '../web-platform-defaults.ts';

test('resolveRequestLocale uses a supported cookie locale when present', () => {
  assert.equal(
    resolveRequestLocale({ cookieLocale: 'de-DE', acceptLanguage: 'en-GB' }),
    'de-DE',
  );
});

test('resolveRequestLocale ignores an unsupported cookie locale', () => {
  assert.equal(
    resolveRequestLocale({ cookieLocale: 'fr-FR', acceptLanguage: 'uk-UA' }),
    'uk-UA',
  );
});

test('resolveRequestLocale resolves supported locale from Accept-Language', () => {
  assert.equal(resolveRequestLocale({ acceptLanguage: 'de-DE' }), 'de-DE');
});

test('resolveRequestLocale respects Accept-Language quality values', () => {
  assert.equal(
    resolveRequestLocale({ acceptLanguage: 'fr-FR;q=0.9, uk-UA;q=0.8, en-GB' }),
    'en-GB',
  );
});

test('resolveRequestLocale maps language tags to Wave 1 default locales', () => {
  assert.equal(
    resolveRequestLocale({ acceptLanguage: 'en-US, en;q=0.9' }),
    'en-GB',
  );
  assert.equal(resolveRequestLocale({ acceptLanguage: 'uk' }), 'uk-UA');
  assert.equal(resolveRequestLocale({ acceptLanguage: 'de' }), 'de-DE');
  assert.equal(resolveRequestLocale({ acceptLanguage: 'ru' }), 'ru-RU');
});

test('resolveRequestLocale normalizes unsupported locales to platform default', () => {
  assert.equal(
    resolveRequestLocale({ acceptLanguage: 'fr-FR, ja-JP' }),
    WEB_PLATFORM_DEFAULT_LOCALE,
  );
});

test('resolveRequestLocale handles malformed Accept-Language values', () => {
  assert.equal(
    resolveRequestLocale({ acceptLanguage: ';;;, ,=,q=not-a-number' }),
    WEB_PLATFORM_DEFAULT_LOCALE,
  );
});

test('resolveRequestLocale falls back to platform default when header is missing', () => {
  assert.equal(resolveRequestLocale({}), WEB_PLATFORM_DEFAULT_LOCALE);
});

test('resolveRequestLocale normalization is deterministic', () => {
  const context = { acceptLanguage: 'EN-gb' };

  assert.equal(resolveRequestLocale(context), 'en-GB');
  assert.equal(resolveRequestLocale(context), 'en-GB');
});

test('parseAcceptLanguage sorts entries by quality descending', () => {
  const entries = parseAcceptLanguage('fr-FR;q=0.5, en-GB;q=0.9, de-DE;q=0.95');

  assert.deepEqual(
    entries.map((entry) => entry.tag),
    ['de-DE', 'en-GB', 'fr-FR'],
  );
});

test('resolveLanguageFromLocale maps supported locales to language codes', () => {
  assert.equal(resolveLanguageFromLocale('en-GB'), 'en');
  assert.equal(resolveLanguageFromLocale('uk-UA'), 'uk');
  assert.equal(resolveLanguageFromLocale('de-DE'), 'de');
  assert.equal(resolveLanguageFromLocale('ru-RU'), 'ru');
});
