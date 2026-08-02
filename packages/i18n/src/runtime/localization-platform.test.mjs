import assert from 'node:assert/strict';
import test from 'node:test';

import { createLocalizationPlatform } from './create-localization-platform.ts';
import { createReadyLocalizationPlatform } from './testing/create-ready-localization-platform.mjs';
import { createTestPlatformInput } from './testing/test-platform-input.mjs';

/** @param {string} value */
function asTranslationKey(value) {
  return value;
}

test('createLocalizationPlatform returns a LocalizationPlatform instance', () => {
  const input = createTestPlatformInput();
  const platform = createLocalizationPlatform(input);

  assert.equal(platform.localeContext, input.localeContext);
  assert.equal(platform.fallbackPolicy, input.fallbackPolicy);
  assert.equal(typeof platform.translate, 'function');
  assert.equal(typeof platform.getBundle, 'function');
});

test('translate returns a value for an existing key', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  const result = platform.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(result.key, 'common.actions.save');
  assert.equal(result.value, 'Save');
  assert.equal(result.locale, 'en-GB');
  assert.equal(result.namespace, 'common');
  assert.equal(result.resolvedFromFallback, false);
});

test('translate applies locale fallback through the bundle loader', async () => {
  const input = createTestPlatformInput({
    localeContext: {
      ...createTestPlatformInput().localeContext,
      locale: 'fr-FR',
    },
  });
  const platform = await createReadyLocalizationPlatform(input);

  const result = platform.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(result.value, 'Save');
  assert.equal(result.locale, 'en-GB');
  assert.equal(result.resolvedFromFallback, true);
});

test('translate throws for a missing key', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  assert.throws(
    () =>
      platform.translate({
        key: asTranslationKey('common.actions.missing'),
      }),
    /Translation key "common.actions.missing" was not found/,
  );
});

test('hasTranslation returns true for existing keys and false for missing keys', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  assert.equal(
    platform.hasTranslation(asTranslationKey('common.actions.save')),
    true,
  );
  assert.equal(
    platform.hasTranslation(asTranslationKey('common.actions.missing')),
    false,
  );
});

test('getBundle delegates to TranslationBundleLoader', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  const bundle = await platform.getBundle({
    locale: 'en-GB',
    namespace: 'dashboard',
  });

  assert.equal(bundle.locale, 'en-GB');
  assert.equal(bundle.namespace, 'dashboard');
  assert.equal(bundle.entries['dashboard.header.title'], 'Diabetes Universe');
});

test('getSupportedLocales uses LocaleRegistryLoader metadata', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  assert.deepEqual(
    platform.getSupportedLocales().map((entry) => ({
      language: entry.language,
      locale: entry.locale,
      isPlatformDefault: entry.isPlatformDefault,
    })),
    [
      { language: 'en', locale: 'en-GB', isPlatformDefault: true },
      { language: 'uk', locale: 'uk-UA', isPlatformDefault: false },
      { language: 'de', locale: 'de-DE', isPlatformDefault: false },
      { language: 'ru', locale: 'ru-RU', isPlatformDefault: false },
    ],
  );
});

test('getDefaultLocale uses LocaleRegistry', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  assert.equal(platform.getDefaultLocale(), 'en-GB');
});

test('getNamespaces uses metadata from LocaleRegistryLoader', async () => {
  const platform = await createReadyLocalizationPlatform(
    createTestPlatformInput(),
  );

  assert.deepEqual(platform.getNamespaces(), [
    'common',
    'dashboard',
    'timeline',
    'quick-add',
    'validation',
    'errors',
  ]);
});
