import assert from 'node:assert/strict';
import test from 'node:test';

import { createLocalizationPlatform } from './create-localization-platform.ts';
import { createReadyLocalizationPlatform } from './testing/create-ready-localization-platform.mjs';
import {
  createCountingRegistryLoader,
  createRejectingRegistryLoader,
  createStalledFirstRegistryLoader,
} from './testing/registry-loader-test-doubles.mjs';
import { createTestPlatformInput } from './testing/test-platform-input.mjs';

/** @param {string} value */
function asTranslationKey(value) {
  return value;
}

/** @param {string} value */
function asLocaleCode(value) {
  return value;
}

/** @param {string} value */
function asNamespace(value) {
  return value;
}

test('createLocalizationPlatform returns a LocalizationPlatform instance', () => {
  const input = createTestPlatformInput();
  const platform = createLocalizationPlatform(input);

  assert.equal(platform.localeContext, input.localeContext);
  assert.equal(platform.fallbackPolicy, input.fallbackPolicy);
  assert.equal(typeof platform.translate, 'function');
  assert.equal(typeof platform.getBundle, 'function');
  assert.equal(typeof platform.whenReady, 'function');
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
  assert.equal(bundle.entries['dashboard.header.title'], 'Home');
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

test('whenReady() resolves after successful registry load', async () => {
  const platform = createLocalizationPlatform(createTestPlatformInput());

  await platform.whenReady();

  assert.equal(platform.getDefaultLocale(), 'en-GB');
});

test('whenReady() does not trigger a second registry loader call', async () => {
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = createCountingRegistryLoader(registry);
  const platform = createLocalizationPlatform({
    ...createTestPlatformInput(),
    localeRegistryLoader,
  });

  await platform.whenReady();
  await platform.whenReady();

  assert.equal(localeRegistryLoader.loadCallCount, 1);
});

test('multiple whenReady() calls await the same lifecycle promise', async () => {
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = createStalledFirstRegistryLoader(registry);
  const platform = createLocalizationPlatform({
    ...createTestPlatformInput(),
    localeRegistryLoader,
  });

  const firstReady = platform.whenReady();
  const secondReady = platform.whenReady();

  let settled = false;
  Promise.all([firstReady, secondReady]).then(() => {
    settled = true;
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  assert.equal(settled, false);

  localeRegistryLoader.releaseFirstPendingLoad();
  await Promise.all([firstReady, secondReady]);

  assert.equal(platform.getDefaultLocale(), 'en-GB');
  assert.equal(localeRegistryLoader.loadCallCount, 1);
});

test('whenReady() enables registry-dependent methods after await', async () => {
  const platform = createLocalizationPlatform(createTestPlatformInput());

  await platform.whenReady();

  assert.equal(platform.getDefaultLocale(), 'en-GB');
  assert.ok(platform.getSupportedLocales().length > 0);
});

test('whenReady() rejects when registry loader fails', async () => {
  const platform = createLocalizationPlatform({
    ...createTestPlatformInput(),
    localeRegistryLoader: createRejectingRegistryLoader(
      'Registry load failed.',
    ),
  });

  await assert.rejects(() => platform.whenReady(), /Registry load failed/);
});

test('whenReady() does not load translation bundles', async () => {
  let bundleLoadCount = 0;
  const platform = createLocalizationPlatform({
    ...createTestPlatformInput(),
    bundleLoader: {
      async load(request) {
        bundleLoadCount += 1;
        return {
          locale: request.locale,
          namespace: request.namespace,
          entries: {},
        };
      },
    },
  });

  await platform.whenReady();

  assert.equal(bundleLoadCount, 0);
});
