import assert from 'node:assert/strict';
import test from 'node:test';

import { createLocalizationPlatform } from '@diabetes-universe/i18n';
import { InMemoryTranslationBundleLoader } from '@diabetes-universe/i18n-locales';
import { createPlatformRuntime } from '@diabetes-universe/platform';
import { createWebPlatformRuntime } from './create-web-platform-runtime.ts';
import { createFormattingRuntime } from './create-formatting-runtime.ts';
import { preparePlatformReadiness } from './prepare-platform-readiness.ts';
import { createLocalizationRuntime } from './create-localization-runtime.ts';
import { createTestWebPlatformConfig } from '../testing/create-test-web-platform-config.mjs';
import {
  createRejectingBundleLoader,
  createRejectingRegistryLoader,
  createStalledFirstRegistryLoader,
} from '../testing/registry-loader-test-doubles.mjs';

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

/**
 * Mirrors createWebPlatformRuntime readiness wiring with an injectable localization
 * instance for controlled loader scenarios in tests only.
 */
async function createWebPlatformRuntimeWithLocalization(config, localization) {
  const formatter = createFormattingRuntime(config.formattingContext);

  await preparePlatformReadiness(localization, config.preload);

  return createPlatformRuntime({
    localization,
    formatter,
  });
}

test('createWebPlatformRuntime returns a Promise<PlatformRuntime>', async () => {
  const config = createTestWebPlatformConfig();
  const runtimePromise = createWebPlatformRuntime(config);

  assert.ok(runtimePromise instanceof Promise);
  const runtime = await runtimePromise;

  assert.equal(typeof runtime.localization.translate, 'function');
  assert.equal(typeof runtime.formatter.formatNumber, 'function');
});

test('createWebPlatformRuntime creates localization and formatter services', async () => {
  const runtime = await createWebPlatformRuntime(createTestWebPlatformConfig());

  assert.equal(runtime.localization.localeContext.locale, 'en-GB');
  assert.equal(typeof runtime.formatter.formatDate, 'function');
});

test('createWebPlatformRuntime returns aggregate via createPlatformRuntime', async () => {
  const runtime = await createWebPlatformRuntime(createTestWebPlatformConfig());

  assert.ok(runtime.localization);
  assert.ok(runtime.formatter);
});

test('createWebPlatformRuntime creates a new runtime on each call', async () => {
  const first = await createWebPlatformRuntime(createTestWebPlatformConfig());
  const second = await createWebPlatformRuntime(createTestWebPlatformConfig());

  assert.notEqual(first, second);
  assert.notEqual(first.localization, second.localization);
  assert.notEqual(first.formatter, second.formatter);
});

test('createWebPlatformRuntime does not mutate the provided config', async () => {
  const config = createTestWebPlatformConfig();
  const snapshot = structuredClone(config);

  await createWebPlatformRuntime(config);

  assert.deepEqual(config, snapshot);
});

test('createWebPlatformRuntime rejects a missing config', async () => {
  await assert.rejects(
    () => createWebPlatformRuntime(undefined),
    /Web platform config config is required/,
  );
});

test('createWebPlatformRuntime rejects a missing localeContext', async () => {
  const config = createTestWebPlatformConfig({ localeContext: undefined });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /Web platform config localeContext is required/,
  );
});

test('createWebPlatformRuntime rejects a missing formattingContext', async () => {
  const config = createTestWebPlatformConfig({ formattingContext: undefined });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /Web platform config formattingContext is required/,
  );
});

test('createWebPlatformRuntime rejects a missing fallbackPolicy', async () => {
  const config = createTestWebPlatformConfig({ fallbackPolicy: undefined });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /Web platform config fallbackPolicy is required/,
  );
});

test('createWebPlatformRuntime rejects a missing preload config', async () => {
  const config = createTestWebPlatformConfig({ preload: undefined });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /Web platform config preload is required/,
  );
});

test('createWebPlatformRuntime rejects invalid preload.locales', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: 'en-GB',
      namespaces: ['common'],
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /preload\.locales must be an array/,
  );
});

test('createWebPlatformRuntime rejects invalid preload.namespaces', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['en-GB'],
      namespaces: null,
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /preload\.namespaces must be an array/,
  );
});

test('createWebPlatformRuntime rejects an empty locale value', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: [''],
      namespaces: ['common'],
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /preload\.locales entry must not be empty/,
  );
});

test('createWebPlatformRuntime rejects an empty namespace value', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['en-GB'],
      namespaces: ['   '],
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /preload\.namespaces entry must not be empty/,
  );
});

test('createWebPlatformRuntime rejects mismatched locale context', async () => {
  const config = createTestWebPlatformConfig({
    formattingContext: {
      locale: asLocaleCode('de-DE'),
      timeZone: 'Europe/London',
      hourCycle: 'h23',
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /formattingContext\.locale must match localeContext\.locale/,
  );
});

test('createWebPlatformRuntime rejects mismatched timeZone context', async () => {
  const config = createTestWebPlatformConfig({
    formattingContext: {
      locale: asLocaleCode('en-GB'),
      timeZone: 'America/New_York',
      hourCycle: 'h23',
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /formattingContext\.timeZone must match localeContext\.timeZone/,
  );
});

test('createWebPlatformRuntime rejects mismatched hourCycle context', async () => {
  const config = createTestWebPlatformConfig({
    formattingContext: {
      locale: asLocaleCode('en-GB'),
      timeZone: 'Europe/London',
      hourCycle: 'h12',
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /formattingContext\.hourCycle must match localeContext\.hourCycle/,
  );
});

test('createWebPlatformRuntime rejects mismatched numberingSystem context', async () => {
  const config = createTestWebPlatformConfig({
    localeContext: {
      language: 'en',
      locale: asLocaleCode('en-GB'),
      timeZone: 'Europe/London',
      hourCycle: 'h23',
      numberingSystem: 'latn',
    },
    formattingContext: {
      locale: asLocaleCode('en-GB'),
      timeZone: 'Europe/London',
      hourCycle: 'h23',
      numberingSystem: 'arab',
    },
  });

  await assert.rejects(
    () => createWebPlatformRuntime(config),
    /formattingContext\.numberingSystem must match localeContext\.numberingSystem/,
  );
});

test('preparePlatformReadiness preloads requested bundles before returning', async () => {
  const config = createTestWebPlatformConfig();
  const { localization } = createLocalizationRuntime(config);

  await preparePlatformReadiness(localization, config.preload);

  const result = localization.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(result.value, 'Save');
  assert.equal(result.locale, 'en-GB');
});

test('preparePlatformReadiness deduplicates duplicate locales', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['en-GB', 'en-GB', 'en-GB'],
      namespaces: ['common'],
    },
  });
  const { localization } = createLocalizationRuntime(config);

  let loadCount = 0;
  const originalGetBundle = localization.getBundle.bind(localization);

  localization.getBundle = async (request) => {
    loadCount += 1;
    return originalGetBundle(request);
  };

  await preparePlatformReadiness(localization, config.preload);

  assert.equal(loadCount, 1);
});

test('preparePlatformReadiness deduplicates duplicate namespaces', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['en-GB'],
      namespaces: ['common', 'common'],
    },
  });
  const { localization } = createLocalizationRuntime(config);

  let loadCount = 0;
  const originalGetBundle = localization.getBundle.bind(localization);

  localization.getBundle = async (request) => {
    loadCount += 1;
    return originalGetBundle(request);
  };

  await preparePlatformReadiness(localization, config.preload);

  assert.equal(loadCount, 1);
});

test('preparePlatformReadiness loads each unique locale and namespace pair once', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['de-DE', 'en-GB'],
      namespaces: ['common', 'dashboard'],
    },
  });
  const { localization } = createLocalizationRuntime(config);

  const seen = new Set();
  const originalGetBundle = localization.getBundle.bind(localization);

  localization.getBundle = async (request) => {
    seen.add(`${request.locale}:${request.namespace}`);
    return originalGetBundle(request);
  };

  await preparePlatformReadiness(localization, config.preload);

  assert.deepEqual([...seen].sort(), [
    'de-DE:common',
    'de-DE:dashboard',
    'en-GB:common',
    'en-GB:dashboard',
  ]);
});

test('preparePlatformReadiness supports selective preload scope', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['en-GB'],
      namespaces: ['dashboard'],
    },
  });
  const runtime = await createWebPlatformRuntime(config);

  const dashboardTitle = runtime.localization.translate({
    key: asTranslationKey('dashboard.header.title'),
  });

  assert.equal(dashboardTitle.value, 'Diabetes Universe');
});

test('createWebPlatformRuntime rejects when preload fails', async () => {
  const config = createTestWebPlatformConfig({
    fallbackPolicy: {
      defaultLocale: asLocaleCode('en-GB'),
      localeFallbackChain: [asLocaleCode('xx-XX')],
    },
    preload: {
      locales: ['fr-FR'],
      namespaces: ['common'],
    },
  });

  await assert.rejects(() => createWebPlatformRuntime(config));
});

test('createWebPlatformRuntime does not return a partially ready runtime on preload failure', async () => {
  const config = createTestWebPlatformConfig({
    preload: {
      locales: ['zz-ZZ'],
      namespaces: ['common'],
    },
    fallbackPolicy: {
      defaultLocale: asLocaleCode('zz-ZZ'),
      localeFallbackChain: [asLocaleCode('zz-ZZ')],
    },
  });

  await assert.rejects(() => createWebPlatformRuntime(config));
});

test('integration: translate works for a preloaded English key after factory completion', async () => {
  const runtime = await createWebPlatformRuntime(createTestWebPlatformConfig());

  const result = runtime.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(result.value, 'Save');
  assert.equal(result.namespace, 'common');
});

test('integration: formatter returns locale-aware output', async () => {
  const runtime = await createWebPlatformRuntime(createTestWebPlatformConfig());

  const formatted = runtime.formatter.formatNumber(1234.5);

  assert.match(formatted, /1/);
  assert.match(formatted, /234/);
});

test('integration: end-to-end uses i18n-locales, localization, formatting, and platform aggregate', async () => {
  const runtime = await createWebPlatformRuntime(
    createTestWebPlatformConfig({
      preload: {
        locales: [asLocaleCode('en-GB')],
        namespaces: [asNamespace('common')],
      },
    }),
  );

  assert.equal(
    runtime.localization.translate({
      key: asTranslationKey('common.actions.save'),
    }).value,
    'Save',
  );
  assert.equal(typeof runtime.formatter.formatNumber(10), 'string');
});

test('SSR isolation: parallel factory calls produce distinct runtimes and contexts', async () => {
  const [runtimeA, runtimeB] = await Promise.all([
    createWebPlatformRuntime(
      createTestWebPlatformConfig({
        localeContext: {
          language: 'en',
          locale: asLocaleCode('en-GB'),
          timeZone: 'Europe/London',
          hourCycle: 'h23',
        },
        formattingContext: {
          locale: asLocaleCode('en-GB'),
          timeZone: 'Europe/London',
          hourCycle: 'h23',
        },
        preload: {
          locales: [asLocaleCode('en-GB')],
          namespaces: [asNamespace('common')],
        },
      }),
    ),
    createWebPlatformRuntime(
      createTestWebPlatformConfig({
        localeContext: {
          language: 'de',
          locale: asLocaleCode('de-DE'),
          timeZone: 'Europe/Berlin',
          hourCycle: 'h23',
        },
        formattingContext: {
          locale: asLocaleCode('de-DE'),
          timeZone: 'Europe/Berlin',
          hourCycle: 'h23',
        },
        preload: {
          locales: [asLocaleCode('de-DE')],
          namespaces: [asNamespace('common')],
        },
      }),
    ),
  ]);

  assert.notEqual(runtimeA, runtimeB);
  assert.notEqual(runtimeA.localization, runtimeB.localization);
  assert.notEqual(runtimeA.formatter, runtimeB.formatter);
  assert.equal(runtimeA.localization.localeContext.locale, 'en-GB');
  assert.equal(runtimeB.localization.localeContext.locale, 'de-DE');
  assert.equal(runtimeA.localization.localeContext.timeZone, 'Europe/London');
  assert.equal(runtimeB.localization.localeContext.timeZone, 'Europe/Berlin');

  const english = runtimeA.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });
  const germanLocale = runtimeB.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(english.value, 'Save');
  assert.equal(germanLocale.locale, 'de-DE');
  assert.notEqual(
    runtimeA.formatter.formatNumber(1234.5),
    runtimeB.formatter.formatNumber(1234.5),
  );
});

test('preparePlatformReadiness rejects when registry loader rejects', async () => {
  const config = createTestWebPlatformConfig();
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: createRejectingBundleLoader('should not be reached'),
    localeRegistryLoader: createRejectingRegistryLoader(),
  });

  await assert.rejects(
    () => preparePlatformReadiness(localization, config.preload),
    /Registry load failed/,
  );
});

test('preparePlatformReadiness rejects when bundle preload fails', async () => {
  const config = createTestWebPlatformConfig();
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = {
    async load() {
      return registry;
    },
  };
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: createRejectingBundleLoader(),
    localeRegistryLoader,
  });

  await assert.rejects(
    () => preparePlatformReadiness(localization, config.preload),
    /Bundle load failed/,
  );
});

test('preparePlatformReadiness waits for registry readiness before preloading bundles', async () => {
  const config = createTestWebPlatformConfig();
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = createStalledFirstRegistryLoader(registry);
  let bundleLoadStarted = false;
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: {
      async load(request) {
        bundleLoadStarted = true;
        return {
          locale: request.locale,
          namespace: request.namespace,
          entries: { 'common.actions.save': 'Save' },
        };
      },
    },
    localeRegistryLoader,
  });

  const readinessPromise = preparePlatformReadiness(
    localization,
    config.preload,
  );

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  assert.equal(bundleLoadStarted, false);

  localeRegistryLoader.releaseFirstPendingLoad();
  await readinessPromise;

  assert.equal(bundleLoadStarted, true);
  assert.equal(localization.getDefaultLocale(), 'en-GB');
});

test('createWebPlatformRuntime does not return until stalled registry load is released', async () => {
  const config = createTestWebPlatformConfig();
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = createStalledFirstRegistryLoader(registry);
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: new InMemoryTranslationBundleLoader(config.fallbackPolicy),
    localeRegistryLoader,
  });

  const runtimePromise = createWebPlatformRuntimeWithLocalization(
    config,
    localization,
  );

  let settled = false;
  runtimePromise.then(() => {
    settled = true;
  });

  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
  assert.equal(settled, false);

  localeRegistryLoader.releaseFirstPendingLoad();
  const runtime = await runtimePromise;

  assert.equal(runtime.localization.getDefaultLocale(), 'en-GB');
  assert.ok(runtime.localization.getSupportedLocales().length > 0);
});

test('createWebPlatformRuntime invokes registry loader exactly once per localization runtime', async () => {
  const config = createTestWebPlatformConfig();
  const registry = {
    platformDefaultLocale: asLocaleCode('en-GB'),
    languageDefaults: [
      { language: 'en', defaultLocale: asLocaleCode('en-GB') },
    ],
    namespaces: [asNamespace('common')],
  };
  const localeRegistryLoader = {
    loadCallCount: 0,
    async load() {
      this.loadCallCount += 1;
      return registry;
    },
  };
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: new InMemoryTranslationBundleLoader(config.fallbackPolicy),
    localeRegistryLoader,
  });

  await createWebPlatformRuntimeWithLocalization(config, localization);

  assert.equal(localeRegistryLoader.loadCallCount, 1);
});

test('createWebPlatformRuntime rejects when registry loader rejects', async () => {
  const config = createTestWebPlatformConfig();
  const localization = createLocalizationPlatform({
    localeContext: config.localeContext,
    fallbackPolicy: config.fallbackPolicy,
    bundleLoader: createRejectingBundleLoader('should not be reached'),
    localeRegistryLoader: createRejectingRegistryLoader(),
  });

  await assert.rejects(
    () => createWebPlatformRuntimeWithLocalization(config, localization),
    /Registry load failed/,
  );
});

test('createWebPlatformRuntime supports registry-dependent methods after return with in-memory loaders', async () => {
  const runtime = await createWebPlatformRuntime(createTestWebPlatformConfig());

  assert.equal(runtime.localization.getDefaultLocale(), 'en-GB');
  assert.ok(runtime.localization.getSupportedLocales().length > 0);
  assert.ok(runtime.localization.getNamespaces().includes('common'));
});

test('createWebPlatformRuntime creates new adapter instances on each call', async () => {
  const firstArtifacts = createLocalizationRuntime(
    createTestWebPlatformConfig(),
  );
  const secondArtifacts = createLocalizationRuntime(
    createTestWebPlatformConfig(),
  );

  assert.notEqual(
    firstArtifacts.localeRegistryLoader,
    secondArtifacts.localeRegistryLoader,
  );
  assert.notEqual(firstArtifacts.localization, secondArtifacts.localization);
});

test('createWebPlatformRuntime with empty preload is registry-ready but not translation-ready', async () => {
  const runtime = await createWebPlatformRuntime(
    createTestWebPlatformConfig({
      preload: {
        locales: [],
        namespaces: [],
      },
    }),
  );

  assert.equal(runtime.localization.getDefaultLocale(), 'en-GB');
  assert.ok(runtime.localization.getSupportedLocales().length > 0);

  assert.throws(
    () =>
      runtime.localization.translate({
        key: asTranslationKey('common.actions.save'),
      }),
    /Translation key "common.actions.save" was not found/,
  );
});
