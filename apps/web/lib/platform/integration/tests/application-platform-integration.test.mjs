import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';

import { createRequestPlatformRuntime } from '../../create-request-platform-runtime.ts';
import { createPresentationSnapshot } from '../../presentation/create-presentation-snapshot.ts';
import { assertClientRuntimeMatchesSnapshot } from '../assert-client-runtime-equivalence.ts';
import { createApplicationPlatformBootstrap } from '../application-platform-bootstrap.ts';
import { createClientPlatformRuntimeFromBootstrap } from '../create-client-platform-runtime-from-bootstrap.ts';
import { createClientPlatformRuntimeFromSnapshot } from '../create-client-platform-runtime.ts';
import { createWebPlatformConfigFromPresentationContext } from '../create-web-platform-config-from-presentation-context.ts';
import { ApplicationRuntimeGate } from '../application-runtime-gate.ts';
import { PlatformProvider } from '../../react/platform-provider.ts';
import { createTestPlatformRuntime } from '../../react/testing/create-test-platform-runtime.ts';
import { usePlatformRuntime } from '../../react/use-platform-runtime.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from './integration-dom-setup.mjs';

function withMockedBrowserTimeZone(timeZone, run) {
  const originalIntl = globalThis.Intl;

  Object.defineProperty(globalThis, 'Intl', {
    configurable: true,
    value: {
      DateTimeFormat: () => ({
        resolvedOptions: () => ({ timeZone }),
      }),
    },
  });

  return Promise.resolve(run()).finally(() => {
    Object.defineProperty(globalThis, 'Intl', {
      configurable: true,
      value: originalIntl,
    });
  });
}

test('createApplicationPlatformBootstrap maps ready result to snapshot only', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Europe/London',
  });

  assert.equal(serverBootstrap.status, 'ready');

  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);

  assert.equal(bootstrap.status, 'ready');
  assert.equal(bootstrap.snapshot.locale, 'en-GB');
  assert.equal(bootstrap.snapshot.timeZone, 'Europe/London');
  assert.equal('runtime' in bootstrap, false);
  assert.equal(Object.isFrozen(bootstrap.snapshot), true);
});

test('createApplicationPlatformBootstrap maps time-zone-required result to seed only', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'uk-UA',
  });

  assert.equal(serverBootstrap.status, 'time-zone-required');

  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);

  assert.equal(bootstrap.status, 'time-zone-required');
  assert.deepEqual(bootstrap.seed, serverBootstrap.seed);
  assert.equal('runtime' in bootstrap, false);
  assert.equal('snapshot' in bootstrap, false);
});

test('application bootstrap payload is JSON-serializable for ready branch', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'de-DE',
    cookieTimeZone: 'Europe/Berlin',
  });
  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);

  assert.doesNotThrow(() => JSON.stringify(bootstrap));
});

test('createWebPlatformConfigFromPresentationContext builds config from resolved context', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'uk-UA', cookieTimeZone: 'Europe/Kyiv' },
  });
  const context = runtime.localization.localeContext;
  const config = createWebPlatformConfigFromPresentationContext(context);

  assert.equal(config.localeContext.locale, 'uk-UA');
  assert.equal(config.localeContext.timeZone, 'Europe/Kyiv');
  assert.equal(config.formattingContext.timeZone, 'Europe/Kyiv');
  assert.equal(Object.isFrozen(config), true);
});

test('snapshot branch creates client runtime equivalent to bootstrap presentation', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const snapshot = createPresentationSnapshot(
    runtime.localization.localeContext,
  );
  const clientRuntime = await createClientPlatformRuntimeFromSnapshot(snapshot);

  assert.doesNotThrow(() =>
    assertClientRuntimeMatchesSnapshot(clientRuntime, snapshot),
  );
});

test('seed and browser TZ branch creates equivalent client runtime', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
  });

  assert.equal(serverBootstrap.status, 'time-zone-required');

  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);

  setupIntegrationDom();

  try {
    await withMockedBrowserTimeZone('Europe/Berlin', async () => {
      const result = await createClientPlatformRuntimeFromBootstrap(bootstrap);

      assert.equal(result.status, 'ready');
      assert.equal(result.runtime.localization.localeContext.locale, 'en-GB');
      assert.equal(
        result.runtime.localization.localeContext.timeZone,
        'Europe/Berlin',
      );
      assert.equal(result.runtime.localization.localeContext.language, 'en');
      assert.equal(result.runtime.localization.localeContext.hourCycle, 'h23');
    });
  } finally {
    teardownIntegrationDom();
  }
});

test('browser TZ unavailable does not create runtime', async () => {
  const bootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime({ acceptLanguage: 'en-GB' }),
  );

  setupIntegrationDom();

  try {
    await withMockedBrowserTimeZone('Invalid/Zone', async () => {
      const result = await createClientPlatformRuntimeFromBootstrap(bootstrap);

      assert.equal(result.status, 'time-zone-unavailable');
    });
  } finally {
    teardownIntegrationDom();
  }
});

test('application platform bootstrap does not serialize runtime services', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
    cookieTimeZone: 'Europe/London',
  });
  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);
  const serialized = JSON.stringify(bootstrap);

  assert.equal(serialized.includes('translate'), false);
  assert.equal(serialized.includes('formatNumber'), false);
});

test('pending gate state does not render product children', async () => {
  const bootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime({
      acceptLanguage: 'en-GB',
      cookieTimeZone: 'Europe/London',
    }),
  );

  const markup = renderToString(
    createElement(
      ApplicationRuntimeGate,
      { bootstrap },
      createElement('div', { 'data-testid': 'product-child' }, 'product'),
    ),
  );

  assert.match(markup, /application-bootstrap-pending/);
  assert.equal(markup.includes('product-child'), false);
  assert.equal(markup.includes('product'), false);
});

test('ready gate mounts PlatformProvider then AppProviders then children', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );
  const functionBody = source.slice(
    source.indexOf('function ReadyApplicationTree'),
  );

  const platformIndex = functionBody.indexOf('PlatformProvider');
  const appProvidersIndex = functionBody.indexOf('AppProviders');

  assert.notEqual(platformIndex, -1);
  assert.notEqual(appProvidersIndex, -1);
  assert.equal(platformIndex < appProvidersIndex, true);
});

test('ready gate mounts AppProviders only inside ready application tree', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('ApplicationProvidersShell'), false);
  assert.equal(source.includes('ReadyApplicationProvidersLoader'), false);
  assert.equal(
    source.includes('return createElement(ApplicationBootstrapPendingScreen);'),
    true,
  );
  assert.equal(
    source
      .slice(source.indexOf('function ReadyApplicationTree'))
      .includes('AppProviders'),
    true,
  );
});

test('ready gate passes exact client runtime reference to PlatformProvider', async () => {
  const runtime = await createTestPlatformRuntime();
  let observedSame = 'no';

  function RuntimeIdentityProbe() {
    const observed = usePlatformRuntime();
    observedSame = observed === runtime ? 'yes' : 'no';

    return createElement('span', { 'data-testid': 'runtime-same' });
  }

  /* eslint-disable react/no-children-prop -- PlatformProviderProps requires children in props for typed createElement */
  const markup = renderToString(
    createElement(PlatformProvider, {
      runtime,
      children: createElement(RuntimeIdentityProbe),
    }),
  );
  /* eslint-enable react/no-children-prop */

  assert.equal(observedSame, 'yes');
  assert.match(markup, /runtime-same/);
});

test('parallel runtime gates do not share runtime instances', async () => {
  const firstBootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime({
      acceptLanguage: 'en-GB',
      cookieTimeZone: 'Europe/London',
    }),
  );
  const secondBootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime({
      acceptLanguage: 'de-DE',
      cookieTimeZone: 'Europe/Berlin',
    }),
  );

  const [firstRuntime, secondRuntime] = await Promise.all([
    createClientPlatformRuntimeFromBootstrap(firstBootstrap),
    createClientPlatformRuntimeFromBootstrap(secondBootstrap),
  ]);

  assert.equal(firstRuntime.status, 'ready');
  assert.equal(secondRuntime.status, 'ready');
  assert.notEqual(firstRuntime.runtime, secondRuntime.runtime);
  assert.notEqual(
    firstRuntime.runtime.localization.localeContext.locale,
    secondRuntime.runtime.localization.localeContext.locale,
  );
});

test('boundary: runtime gate does not import server bootstrap entry', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('createRequestPlatformRuntime'), false);
  assert.equal(source.includes('ensureServerOnly'), false);
  assert.equal(source.includes('next/headers'), false);
  assert.equal(source.includes('useLayoutEffect'), false);
  assert.equal(source.includes('Suspense'), false);
});

test('boundary: server integration mapper does not import client-only presentation resolver', async () => {
  const source = await readFile(
    new URL('../application-platform-bootstrap.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('resolveBrowserTimeZone'), false);
  assert.equal(source.includes('presentation/client'), false);
  assert.equal(source.includes('PlatformProvider'), false);
});

test('boundary: layout imports server bootstrap and serializable mapper only', async () => {
  const source = await readFile(
    new URL('../../../../app/layout.tsx', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('createRequestPlatformRuntime'), true);
  assert.equal(source.includes('createApplicationPlatformBootstrap'), true);
  assert.equal(source.includes("from '../react/platform-provider"), false);
  assert.equal(source.includes('createWebPlatformRuntime'), false);
});

test('boundary: integration modules do not import Dashboard, Timeline, or Quick Add product code', async () => {
  const modulePaths = [
    '../application-runtime-gate.ts',
    '../create-client-platform-runtime.ts',
    '../create-client-platform-runtime-from-bootstrap.ts',
    '../application-platform-bootstrap.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes('components/dashboard'), false);
    assert.equal(source.includes('components/timeline'), false);
    assert.equal(source.includes('components/quick-add'), false);
    assert.equal(source.includes('lib/quick-add'), false);
  }
});

test('parallel server bootstraps do not share runtime instances', async () => {
  const [first, second] = await Promise.all([
    createRequestPlatformRuntime({
      acceptLanguage: 'en-GB',
      cookieTimeZone: 'Europe/London',
    }),
    createRequestPlatformRuntime({
      acceptLanguage: 'de-DE',
      cookieTimeZone: 'Europe/Berlin',
    }),
  ]);

  assert.equal(first.status, 'ready');
  assert.equal(second.status, 'ready');
  assert.notEqual(first.runtime, second.runtime);
});

test('time-zone-required server bootstrap never includes runtime in application payload', async () => {
  const serverBootstrap = await createRequestPlatformRuntime({
    acceptLanguage: 'en-GB',
  });

  const bootstrap = createApplicationPlatformBootstrap(serverBootstrap);

  assert.equal(bootstrap.status, 'time-zone-required');
  assert.equal('runtime' in bootstrap, false);
  assert.equal('timeZone' in bootstrap.seed, false);
});

test('runtime gate does not create module-level runtime singleton', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );

  assert.equal(/let\s+\w*runtime\w*\s*=/i.test(source), false);
  assert.equal(/const\s+\w*runtime\w*\s*=/i.test(source), false);
  assert.equal(source.includes('globalThis'), false);
});

test('client integration modules do not use UTC or geographic time-zone fallback', async () => {
  const modulePaths = [
    '../application-runtime-gate.ts',
    '../create-client-platform-runtime.ts',
    '../create-client-platform-runtime-from-bootstrap.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes("'UTC'"), false);
    assert.equal(source.includes('"UTC"'), false);
    assert.equal(source.includes('geographic'), false);
    assert.equal(source.includes('defaultTimeZone'), false);
  }
});

test('ready application tree exposes non-visual readiness marker only', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );

  const readyTreeSource = source.slice(
    source.indexOf('function ReadyApplicationTree'),
  );

  assert.match(readyTreeSource, /APPLICATION_PLATFORM_STATUS_ATTRIBUTE/);
  assert.match(readyTreeSource, /APPLICATION_PLATFORM_READY_STATUS/);
  assert.match(readyTreeSource, /display:\s*'contents'/);
  assert.equal(source.includes('ApplicationPlatformProviders'), false);
});

test('pending gate render does not include readiness marker', async () => {
  const bootstrap = createApplicationPlatformBootstrap(
    await createRequestPlatformRuntime({
      acceptLanguage: 'en-GB',
      cookieTimeZone: 'Europe/London',
    }),
  );

  const markup = renderToString(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap,
        runtimeBootstrapper: () => new Promise(() => {}),
      },
      createElement('div', { 'data-testid': 'product-child' }, 'product'),
    ),
  );

  assert.equal(markup.includes('data-platform-status="ready"'), false);
});

test('TimelineStoreProvider mounts only inside ready PlatformProvider tree', async () => {
  const source = await readFile(
    new URL('../application-runtime-gate.ts', import.meta.url),
    'utf8',
  );

  const gateFunctionSource = source.slice(
    source.indexOf('export function ApplicationRuntimeGate'),
    source.indexOf('function ReadyApplicationTree'),
  );
  const readyTreeSource = source.slice(
    source.indexOf('function ReadyApplicationTree'),
  );

  assert.equal(gateFunctionSource.includes('AppProviders'), false);
  assert.equal(readyTreeSource.includes('PlatformProvider'), true);
  assert.equal(readyTreeSource.includes('AppProviders'), true);
});
