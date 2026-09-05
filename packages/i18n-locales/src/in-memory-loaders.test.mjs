import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryLocaleRegistryLoader } from './in-memory-locale-registry-loader.ts';
import {
  InMemoryTranslationBundleLoader,
  TranslationBundleNotFoundError,
} from './in-memory-translation-bundle-loader.ts';

const platformFallbackPolicy = {
  defaultLocale: 'en-GB',
  localeFallbackChain: ['en-GB'],
};

/** @param {string} value */
function asLocaleCode(value) {
  return value;
}

/** @param {string} value */
function asNamespace(value) {
  return value;
}

test('loads the English bundle for en-GB', async () => {
  const loader = new InMemoryTranslationBundleLoader(platformFallbackPolicy);

  const bundle = await loader.load({
    locale: asLocaleCode('en-GB'),
    namespace: asNamespace('common'),
  });

  assert.equal(bundle.locale, 'en-GB');
  assert.equal(bundle.namespace, 'common');
  assert.equal(bundle.entries['common.actions.save'], 'Save');
  assert.equal(bundle.entries['common.actions.cancel'], 'Cancel');
  assert.equal(bundle.entries['common.actions.close'], 'Close');
});

test('loads approved bundles for supported production locales', async () => {
  const loader = new InMemoryTranslationBundleLoader(platformFallbackPolicy);

  const expectedTitles = {
    'de-DE': 'Start',
    'ru-RU': 'Главная',
    'uk-UA': 'Головна',
  };

  for (const locale of ['uk-UA', 'de-DE', 'ru-RU']) {
    const bundle = await loader.load({
      locale: asLocaleCode(locale),
      namespace: asNamespace('dashboard'),
    });

    assert.equal(bundle.locale, locale);
    assert.equal(
      bundle.entries['dashboard.header.title'],
      expectedTitles[locale],
    );
  }
});

test('falls back through the approved locale chain when the requested locale is missing', async () => {
  const loader = new InMemoryTranslationBundleLoader(platformFallbackPolicy);

  const bundle = await loader.load({
    locale: asLocaleCode('fr-FR'),
    namespace: asNamespace('common'),
  });

  assert.equal(bundle.locale, 'en-GB');
  assert.equal(bundle.entries['common.actions.save'], 'Save');
});

test('throws when the requested locale and fallback chain cannot be resolved', async () => {
  const loader = new InMemoryTranslationBundleLoader({
    defaultLocale: 'en-GB',
    localeFallbackChain: ['xx-XX'],
  });

  await assert.rejects(
    () =>
      loader.load({
        locale: asLocaleCode('fr-FR'),
        namespace: asNamespace('common'),
      }),
    (error) => {
      assert.ok(error instanceof TranslationBundleNotFoundError);
      assert.equal(error.requestedLocale, 'fr-FR');
      assert.deepEqual(error.attemptedLocales, ['fr-FR', 'xx-XX']);
      return true;
    },
  );
});

test('loads LocaleRegistry from locale metadata exports', async () => {
  const loader = new InMemoryLocaleRegistryLoader();

  const registry = await loader.load();

  assert.equal(registry.platformDefaultLocale, 'en-GB');
  assert.deepEqual(
    registry.languageDefaults.map((entry) => ({
      language: entry.language,
      defaultLocale: entry.defaultLocale,
    })),
    [
      { language: 'en', defaultLocale: 'en-GB' },
      { language: 'uk', defaultLocale: 'uk-UA' },
      { language: 'de', defaultLocale: 'de-DE' },
      { language: 'ru', defaultLocale: 'ru-RU' },
    ],
  );
});
