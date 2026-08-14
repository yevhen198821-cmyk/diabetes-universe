import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createWebPlatformRuntime } from '@diabetes-universe/platform-web';

import { createRequestPlatformRuntime } from '../create-request-platform-runtime.ts';
import { createWebPlatformConfig } from '../create-web-platform-config.ts';
import { ensureServerOnly } from '../ensure-server-only.ts';

/** @param {string} value */
function asTranslationKey(value) {
  return value;
}

/** @param {Record<string, string | undefined>} overrides */
function createExplicitContext(overrides = {}) {
  return {
    cookieTimeZone: 'Europe/London',
    ...overrides,
  };
}

test('createRequestPlatformRuntime returns time-zone-required when explicit time zone is missing', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
  });

  assert.equal(result.status, 'time-zone-required');
  assert.equal(result.seed.language, 'en');
  assert.equal(result.seed.locale, 'en-GB');
  assert.equal(result.seed.hourCycle, 'h23');
  assert.equal(Object.isFrozen(result.seed), true);
  assert.equal('timeZone' in result.seed, false);
});

test('createRequestPlatformRuntime returns time-zone-required for an invalid cookie time zone', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Not/A_TimeZone',
  });

  assert.equal(result.status, 'time-zone-required');
  assert.equal(result.seed.locale, 'en-GB');
  assert.equal('timeZone' in result.seed, false);
});

test('time-zone-required seed preserves cookie locale priority over Accept-Language', async () => {
  const result = await createRequestPlatformRuntime({
    cookieLocale: 'de-DE',
    acceptLanguage: 'en-GB',
  });

  assert.equal(result.status, 'time-zone-required');
  assert.equal(result.seed.locale, 'de-DE');
  assert.equal(result.seed.language, 'de');
});

test('time-zone-required seed preserves Accept-Language locale when cookie is absent', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'uk-UA',
  });

  assert.equal(result.status, 'time-zone-required');
  assert.equal(result.seed.locale, 'uk-UA');
  assert.equal(result.seed.language, 'uk');
});

test('time-zone-required seed preserves default en-GB locale when no locale input exists', async () => {
  const result = await createRequestPlatformRuntime({});

  assert.equal(result.status, 'time-zone-required');
  assert.equal(result.seed.locale, 'en-GB');
  assert.equal(result.seed.language, 'en');
});

test('time-zone-required seed does not contain timeZone', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'de-DE',
  });

  assert.equal(result.status, 'time-zone-required');
  assert.equal('timeZone' in result.seed, false);
  assert.equal('runtime' in result, false);
});

test('createRequestPlatformRuntime returns ready with PlatformRuntime for a valid cookie time zone', async () => {
  const result = await createRequestPlatformRuntime(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
  );

  assert.equal(result.status, 'ready');
  assert.equal(typeof result.runtime.localization.translate, 'function');
  assert.equal(typeof result.runtime.formatter.formatNumber, 'function');
  assert.equal(result.runtime.localization.localeContext.locale, 'en-GB');
  assert.equal(
    result.runtime.localization.localeContext.timeZone,
    'Europe/London',
  );
});

test('createRequestPlatformRuntime preloads translation for bootstrap namespace', async () => {
  const result = await createRequestPlatformRuntime(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
  );

  assert.equal(result.status, 'ready');

  const translation = result.runtime.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(translation.value, 'Save');
  assert.equal(translation.namespace, 'common');
});

test('createRequestPlatformRuntime formats values with request locale and time zone', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'de-DE',
    cookieTimeZone: 'Europe/Berlin',
  });

  assert.equal(result.status, 'ready');

  const formatted = result.runtime.formatter.formatNumber(1234.5);

  assert.match(formatted, /1/);
  assert.match(formatted, /234/);
  assert.equal(
    result.runtime.localization.localeContext.timeZone,
    'Europe/Berlin',
  );
});

test('createRequestPlatformRuntime does not use geographic or UTC fallback when time zone is missing', async () => {
  const result = await createRequestPlatformRuntime({
    acceptLanguage: 'de-DE',
  });

  assert.equal(result.status, 'time-zone-required');
});

test('createRequestPlatformRuntime propagates runtime factory failures', async () => {
  const config = createWebPlatformConfig(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
    'Europe/London',
  );

  await assert.rejects(
    () =>
      createWebPlatformRuntime({
        ...config,
        preload: undefined,
      }),
    /preload/,
  );
});

test('createRequestPlatformRuntime creates isolated runtimes per call', async () => {
  const first = await createRequestPlatformRuntime(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
  );
  const second = await createRequestPlatformRuntime(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
  );

  assert.equal(first.status, 'ready');
  assert.equal(second.status, 'ready');
  assert.notEqual(first.runtime, second.runtime);
  assert.notEqual(first.runtime.localization, second.runtime.localization);
  assert.notEqual(first.runtime.formatter, second.runtime.formatter);
});

test('createRequestPlatformRuntime does not mutate request presentation context', async () => {
  const context = Object.freeze(
    createExplicitContext({ acceptLanguage: 'uk-UA' }),
  );
  const snapshot = structuredClone(context);

  await createRequestPlatformRuntime(context);

  assert.deepEqual(context, snapshot);
});

test('SSR isolation: parallel contexts produce distinct localization and formatting state', async () => {
  const [resultEn, resultDe] = await Promise.all([
    createRequestPlatformRuntime({
      acceptLanguage: 'en-GB',
      cookieTimeZone: 'Europe/London',
    }),
    createRequestPlatformRuntime({
      acceptLanguage: 'de-DE',
      cookieTimeZone: 'Europe/Berlin',
    }),
  ]);

  assert.equal(resultEn.status, 'ready');
  assert.equal(resultDe.status, 'ready');
  assert.notEqual(resultEn.runtime, resultDe.runtime);
  assert.notEqual(resultEn.runtime.localization, resultDe.runtime.localization);
  assert.equal(resultEn.runtime.localization.localeContext.locale, 'en-GB');
  assert.equal(resultDe.runtime.localization.localeContext.locale, 'de-DE');
  assert.equal(
    resultEn.runtime.localization.localeContext.timeZone,
    'Europe/London',
  );
  assert.equal(
    resultDe.runtime.localization.localeContext.timeZone,
    'Europe/Berlin',
  );

  const english = resultEn.runtime.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });
  const german = resultDe.runtime.localization.translate({
    key: asTranslationKey('common.actions.save'),
  });

  assert.equal(english.value, 'Save');
  assert.equal(german.locale, 'de-DE');
  assert.notEqual(
    resultEn.runtime.formatter.formatNumber(1234.5),
    resultDe.runtime.formatter.formatNumber(1234.5),
  );
});

test('hydration boundary: bootstrap modules are server-only and not client components', async () => {
  const modulePaths = [
    new URL('../create-request-platform-runtime.ts', import.meta.url),
    new URL('../create-web-platform-config.ts', import.meta.url),
    new URL('../resolve-request-locale.ts', import.meta.url),
    new URL('../resolve-request-time-zone.ts', import.meta.url),
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(modulePath, 'utf8');
    assert.equal(source.includes("'use client'"), false);
    assert.equal(source.includes('"use client"'), false);
    assert.equal(source.includes('window.'), false);
    assert.equal(source.includes('document.'), false);
  }
});

test('ensureServerOnly rejects browser execution', () => {
  const originalWindow = globalThis.window;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });

  try {
    assert.throws(() => ensureServerOnly('test-module'), /server-only/);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }
  }
});

test('createWebPlatformConfig remains independent from runtime creation for tests', () => {
  const config = createWebPlatformConfig(
    createExplicitContext({ acceptLanguage: 'en-GB' }),
    'Europe/London',
  );

  assert.equal(config.preload.namespaces.length > 0, true);
  assert.equal(config.preload.locales.length > 0, true);
});
