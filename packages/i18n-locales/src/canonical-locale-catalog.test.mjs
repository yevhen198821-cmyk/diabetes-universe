import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_LANGUAGE_DEFAULT_LOCALES,
  CANONICAL_PLATFORM_DEFAULT_LOCALE,
  CANONICAL_SUPPORTED_LOCALE_CODES,
  CANONICAL_SUPPORTED_LOCALE_METADATA,
  CANONICAL_TRANSLATION_FALLBACK_POLICY,
  getCanonicalSupportedLocaleMetadata,
  isCanonicalSupportedLocale,
  parseCanonicalSupportedLocale,
} from './canonical-locale-catalog.ts';
import { resolveLocaleChain } from './resolve-locale-chain.ts';

test('canonical supported locales are exactly EN/DE/UK/RU', () => {
  assert.deepEqual([...CANONICAL_SUPPORTED_LOCALE_CODES].sort(), [
    'de-DE',
    'en-GB',
    'ru-RU',
    'uk-UA',
  ]);
});

test('en-GB is the platform default', () => {
  assert.equal(CANONICAL_PLATFORM_DEFAULT_LOCALE, 'en-GB');
  assert.equal(CANONICAL_TRANSLATION_FALLBACK_POLICY.defaultLocale, 'en-GB');
});

test('language defaults map each supported language to one locale', () => {
  assert.deepEqual(CANONICAL_LANGUAGE_DEFAULT_LOCALES, {
    de: 'de-DE',
    en: 'en-GB',
    ru: 'ru-RU',
    uk: 'uk-UA',
  });
});

test('fallback policy is requested locale then en-GB only', () => {
  assert.deepEqual(
    [...CANONICAL_TRANSLATION_FALLBACK_POLICY.localeFallbackChain],
    ['en-GB'],
  );

  for (const locale of CANONICAL_SUPPORTED_LOCALE_CODES) {
    assert.deepEqual(
      resolveLocaleChain(locale, CANONICAL_TRANSLATION_FALLBACK_POLICY),
      locale === 'en-GB' ? ['en-GB'] : [locale, 'en-GB'],
    );
  }
});

test('fallback never walks through an unsupported sibling language', () => {
  const germanChain = resolveLocaleChain(
    'de-DE',
    CANONICAL_TRANSLATION_FALLBACK_POLICY,
  );

  assert.equal(germanChain.includes('uk-UA'), false);
  assert.equal(germanChain.includes('ru-RU'), false);
});

test('selector metadata covers every supported locale in native names', () => {
  assert.deepEqual(
    CANONICAL_SUPPORTED_LOCALE_METADATA.map((entry) => entry.locale),
    [...CANONICAL_SUPPORTED_LOCALE_CODES],
  );
  assert.equal(
    getCanonicalSupportedLocaleMetadata('en-GB').nativeName,
    'English',
  );
  assert.equal(
    getCanonicalSupportedLocaleMetadata('de-DE').nativeName,
    'Deutsch',
  );
  assert.equal(
    getCanonicalSupportedLocaleMetadata('uk-UA').nativeName,
    'Українська',
  );
  assert.equal(
    getCanonicalSupportedLocaleMetadata('ru-RU').nativeName,
    'Русский',
  );
});

test('parseCanonicalSupportedLocale accepts only exact canonical locales', () => {
  assert.equal(parseCanonicalSupportedLocale('de-DE'), 'de-DE');
  assert.equal(parseCanonicalSupportedLocale(' uk-UA '), 'uk-UA');
  assert.equal(parseCanonicalSupportedLocale('de'), null);
  assert.equal(parseCanonicalSupportedLocale('de-AT'), null);
  assert.equal(parseCanonicalSupportedLocale('en-US'), null);
  assert.equal(parseCanonicalSupportedLocale('not-a-locale'), null);
  assert.equal(parseCanonicalSupportedLocale(''), null);
  assert.equal(parseCanonicalSupportedLocale(undefined), null);
  assert.equal(isCanonicalSupportedLocale('fr-FR'), false);
});
