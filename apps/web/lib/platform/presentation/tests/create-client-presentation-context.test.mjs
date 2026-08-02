import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createRequestPlatformRuntime } from '../../create-request-platform-runtime.ts';
import { asLocaleCode } from '../../platform-type-helpers.ts';
import { createClientPresentationBootstrapResult } from '../create-client-presentation-context.ts';
import { createWebPlatformRuntime } from '@diabetes-universe/platform-web';

function withMockedBrowserTimeZone(timeZone, run) {
  const originalWindow = globalThis.window;
  const originalIntl = globalThis.Intl;

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {},
  });

  Object.defineProperty(globalThis, 'Intl', {
    configurable: true,
    value: {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone }),
      }),
    },
  });

  try {
    return run();
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: originalWindow,
      });
    }

    Object.defineProperty(globalThis, 'Intl', {
      configurable: true,
      value: originalIntl,
    });
  }
}

test('createClientPresentationBootstrapResult returns ready for an existing runtime context', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Europe/London',
  });

  assert.equal(serverBootstrap.status, 'ready');

  const result = createClientPresentationBootstrapResult({
    serverBootstrap,
  });

  assert.equal(result.status, 'ready');
  assert.equal(result.context.locale, 'en-GB');
  assert.equal(result.context.timeZone, 'Europe/London');
  assert.equal(result.snapshot.version, 1);
  assert.equal(result.snapshot.timeZone, 'Europe/London');
});

test('createClientPresentationBootstrapResult handles time-zone-required with browser resolution using bootstrap seed', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
  });

  assert.equal(serverBootstrap.status, 'time-zone-required');

  withMockedBrowserTimeZone('Europe/Berlin', () => {
    const result = createClientPresentationBootstrapResult({
      serverBootstrap,
    });

    assert.equal(result.status, 'ready');
    assert.equal(result.context.locale, 'en-GB');
    assert.equal(result.context.timeZone, 'Europe/Berlin');
    assert.equal(result.snapshot.timeZone, 'Europe/Berlin');
    assert.equal(result.context.language, serverBootstrap.seed.language);
    assert.equal(result.context.hourCycle, serverBootstrap.seed.hourCycle);
  });
});

test('createClientPresentationBootstrapResult uses cookie locale from bootstrap seed', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    cookieLocale: 'de-DE',
    acceptLanguage: 'en-GB',
  });

  assert.equal(serverBootstrap.status, 'time-zone-required');
  assert.equal(serverBootstrap.seed.locale, 'de-DE');

  withMockedBrowserTimeZone('Europe/Berlin', () => {
    const result = createClientPresentationBootstrapResult({
      serverBootstrap,
    });

    assert.equal(result.status, 'ready');
    assert.equal(result.context.locale, 'de-DE');
    assert.equal(result.snapshot.locale, 'de-DE');
  });
});

test('createClientPresentationBootstrapResult returns time-zone-unavailable without guessing', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
  });

  withMockedBrowserTimeZone('Invalid/Zone', () => {
    const result = createClientPresentationBootstrapResult({
      serverBootstrap,
    });

    assert.deepEqual(result, { status: 'time-zone-unavailable' });
  });
});

test('createClientPresentationBootstrapResult does not mutate bootstrap input', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'uk-UA',
    cookieTimeZone: 'Europe/Kyiv',
  });
  const before = {
    status: serverBootstrap.status,
    locale: serverBootstrap.runtime.localization.localeContext.locale,
    timeZone: serverBootstrap.runtime.localization.localeContext.timeZone,
    hourCycle: serverBootstrap.runtime.localization.localeContext.hourCycle,
  };

  createClientPresentationBootstrapResult({ serverBootstrap });

  assert.equal(serverBootstrap.status, before.status);
  assert.equal(
    serverBootstrap.runtime.localization.localeContext.locale,
    before.locale,
  );
  assert.equal(
    serverBootstrap.runtime.localization.localeContext.timeZone,
    before.timeZone,
  );
  assert.equal(
    serverBootstrap.runtime.localization.localeContext.hourCycle,
    before.hourCycle,
  );
});

test('createClientPresentationBootstrapResult does not mutate time-zone-required seed', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'de-DE',
  });
  const seedSnapshot = {
    language: serverBootstrap.seed.language,
    locale: serverBootstrap.seed.locale,
    hourCycle: serverBootstrap.seed.hourCycle,
  };

  withMockedBrowserTimeZone('Europe/Berlin', () => {
    createClientPresentationBootstrapResult({ serverBootstrap });
  });

  assert.deepEqual(
    {
      language: serverBootstrap.seed.language,
      locale: serverBootstrap.seed.locale,
      hourCycle: serverBootstrap.seed.hourCycle,
    },
    seedSnapshot,
  );
});

test('createClientPresentationBootstrapResult produces deterministic output', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Europe/London',
  });

  const first = createClientPresentationBootstrapResult({ serverBootstrap });
  const second = createClientPresentationBootstrapResult({ serverBootstrap });

  assert.deepEqual(first, second);
});

test('createClientPresentationBootstrapResult does not expose partial PlatformRuntime state', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Europe/London',
  });

  const result = createClientPresentationBootstrapResult({ serverBootstrap });

  assert.equal(result.status, 'ready');
  assert.equal('runtime' in result, false);
});

test('runtime factory infrastructure errors still reject', async () => {
  const config = {
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
    fallbackPolicy: {
      defaultLocale: asLocaleCode('en-GB'),
      localeFallbackChain: [asLocaleCode('en-GB')],
    },
    preload: undefined,
  };

  await assert.rejects(() => createWebPlatformRuntime(config), /preload/);
});

test('boundary: server bootstrap module does not import browser resolver', async () => {
  const source = await readFile(
    new URL('../../create-request-platform-runtime.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('resolve-browser-time-zone'), false);
  assert.equal(source.includes('resolveBrowserTimeZone'), false);
});

test('boundary: isomorphic presentation modules do not import Dashboard, Timeline, or Quick Add', async () => {
  const modulePaths = [
    '../create-presentation-snapshot.ts',
    '../restore-presentation-context.ts',
    '../presentation-context.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes('components/dashboard'), false);
    assert.equal(source.includes('components/timeline'), false);
    assert.equal(source.includes('components/quick-add'), false);
    assert.equal(source.includes("'use client'"), false);
    assert.equal(source.includes('next/'), false);
    assert.equal(source.includes('react'), false);
  }
});

test('boundary: client presentation modules do not import Dashboard, Timeline, or Quick Add', async () => {
  const modulePaths = [
    '../create-client-presentation-context.ts',
    '../resolve-browser-time-zone.ts',
    '../client.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes('components/dashboard'), false);
    assert.equal(source.includes('components/timeline'), false);
    assert.equal(source.includes('components/quick-add'), false);
    assert.equal(source.includes("'use client'"), false);
    assert.equal(source.includes('next/'), false);
    assert.equal(source.includes('react'), false);
  }
});
