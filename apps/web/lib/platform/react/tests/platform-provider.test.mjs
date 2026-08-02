import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { createElement, Fragment } from 'react';
import { renderToString } from 'react-dom/server';

import { PlatformProvider } from '../platform-provider.ts';
import { useFormatter } from '../use-formatter.ts';
import { useLocalization } from '../use-localization.ts';
import { usePlatformRuntime } from '../use-platform-runtime.ts';
import { usePresentationContext } from '../use-presentation-context.ts';
import { createTestPlatformRuntime } from '../testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../testing/test-platform-provider.ts';

const MISSING_PROVIDER_MESSAGE =
  'PlatformProvider is required to use the platform React integration.';

function RuntimeProbe() {
  const runtime = usePlatformRuntime();
  const localization = useLocalization();
  const formatter = useFormatter();
  const presentationContext = usePresentationContext();

  return createElement(
    'span',
    {
      'data-runtime-match':
        runtime.localization === localization && runtime.formatter === formatter
          ? 'yes'
          : 'no',
      'data-locale': presentationContext.locale,
      'data-time-zone': presentationContext.timeZone,
    },
    'ok',
  );
}

test('PlatformProvider renders children', async () => {
  const runtime = await createTestPlatformRuntime();

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement('span', null, 'child'),
    ),
  );

  assert.match(markup, /<span>child<\/span>/);
});

test('PlatformProvider exposes the exact runtime instance', async () => {
  const runtime = await createTestPlatformRuntime();

  function RuntimeIdentityProbe() {
    const observed = usePlatformRuntime();

    return createElement('span', {
      'data-same': observed === runtime ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(RuntimeIdentityProbe),
    ),
  );

  assert.match(markup, /data-same="yes"/);
});

test('PlatformProvider supplies runtime to all hooks', async () => {
  const runtime = await createTestPlatformRuntime();

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(RuntimeProbe),
    ),
  );

  assert.match(markup, /data-runtime-match="yes"/);
  assert.match(markup, /data-locale="en-GB"/);
  assert.match(markup, /data-time-zone="Europe\/London"/);
});

test('PlatformProvider does not mutate the supplied runtime', async () => {
  const runtime = await createTestPlatformRuntime();
  const localeBefore = runtime.localization.localeContext.locale;
  const timeZoneBefore = runtime.localization.localeContext.timeZone;

  renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(RuntimeProbe),
    ),
  );

  assert.equal(runtime.localization.localeContext.locale, localeBefore);
  assert.equal(runtime.localization.localeContext.timeZone, timeZoneBefore);
});

test('PlatformProvider passes the runtime prop reference as context value', async () => {
  const runtime = await createTestPlatformRuntime();

  function ReferenceProbe() {
    const observedRuntime = usePlatformRuntime();
    const observedLocalization = useLocalization();
    const observedFormatter = useFormatter();

    return createElement('span', {
      'data-runtime-same': observedRuntime === runtime ? 'yes' : 'no',
      'data-localization-same':
        observedLocalization === runtime.localization ? 'yes' : 'no',
      'data-formatter-same':
        observedFormatter === runtime.formatter ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(ReferenceProbe),
    ),
  );

  assert.match(markup, /data-runtime-same="yes"/);
  assert.match(markup, /data-localization-same="yes"/);
  assert.match(markup, /data-formatter-same="yes"/);
});

test('PlatformProvider updates context when the runtime prop changes', async () => {
  const firstRuntime = await createTestPlatformRuntime();
  const secondRuntime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });

  function LocaleProbe() {
    return createElement('span', {
      'data-locale': usePresentationContext().locale,
    });
  }

  const firstMarkup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime: firstRuntime },
      createElement(LocaleProbe),
    ),
  );
  const secondMarkup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime: secondRuntime },
      createElement(LocaleProbe),
    ),
  );

  assert.match(firstMarkup, /data-locale="en-GB"/);
  assert.match(secondMarkup, /data-locale="de-DE"/);
});

test('standalone PlatformProvider works without a parent provider', async () => {
  const runtime = await createTestPlatformRuntime();

  const markup = renderToString(
    createElement(PlatformProvider, { runtime }, createElement(RuntimeProbe)),
  );

  assert.match(markup, /data-runtime-match="yes"/);
});

test('nested Provider child receives inner runtime', async () => {
  const outerRuntime = await createTestPlatformRuntime();
  const innerRuntime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });

  function ChildProbe() {
    return createElement('span', {
      'data-locale': usePresentationContext().locale,
      'data-same': usePlatformRuntime() === innerRuntime ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      PlatformProvider,
      { runtime: outerRuntime },
      createElement(
        PlatformProvider,
        { runtime: innerRuntime },
        createElement(ChildProbe),
      ),
    ),
  );

  assert.match(markup, /data-locale="de-DE"/);
  assert.match(markup, /data-same="yes"/);
});

test('nested Provider sibling receives outer runtime', async () => {
  const outerRuntime = await createTestPlatformRuntime();
  const innerRuntime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });

  function SiblingProbe() {
    return createElement('span', {
      'data-locale': usePresentationContext().locale,
      'data-same': usePlatformRuntime() === outerRuntime ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      PlatformProvider,
      { runtime: outerRuntime },
      createElement(
        Fragment,
        null,
        createElement(
          PlatformProvider,
          { runtime: innerRuntime },
          createElement('span', null, 'inner'),
        ),
        createElement(SiblingProbe),
      ),
    ),
  );

  assert.match(markup, /data-locale="en-GB"/);
  assert.match(markup, /data-same="yes"/);
});

test('platform context has no nested-provider detection state', async () => {
  const contextSource = await readFile(
    new URL('../platform-context.ts', import.meta.url),
    'utf8',
  );
  const providerSource = await readFile(
    new URL('../platform-provider.ts', import.meta.url),
    'utf8',
  );

  assert.match(contextSource, /createContext<PlatformRuntime \| null>/);
  assert.equal(contextSource.includes('nested'), false);
  assert.equal(contextSource.includes('guard'), false);
  assert.equal(contextSource.includes('presence'), false);
  assert.equal(providerSource.includes('useContext'), false);
  assert.equal(providerSource.includes('nested'), false);
  assert.equal(providerSource.includes('ancestor'), false);
});

test('usePlatformRuntime fails fast without PlatformProvider', () => {
  assert.throws(
    () => renderToString(createElement(RuntimeProbe)),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message, MISSING_PROVIDER_MESSAGE);
      return true;
    },
  );
});

test('useLocalization fails fast without PlatformProvider', () => {
  function LocalizationProbe() {
    useLocalization();
    return null;
  }

  assert.throws(
    () => renderToString(createElement(LocalizationProbe)),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message, MISSING_PROVIDER_MESSAGE);
      return true;
    },
  );
});

test('useFormatter fails fast without PlatformProvider', () => {
  function FormatterProbe() {
    useFormatter();
    return null;
  }

  assert.throws(
    () => renderToString(createElement(FormatterProbe)),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message, MISSING_PROVIDER_MESSAGE);
      return true;
    },
  );
});

test('usePresentationContext fails fast without PlatformProvider', () => {
  function PresentationProbe() {
    usePresentationContext();
    return null;
  }

  assert.throws(
    () => renderToString(createElement(PresentationProbe)),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message, MISSING_PROVIDER_MESSAGE);
      return true;
    },
  );
});

test('useLocalization returns exact runtime.localization', async () => {
  const runtime = await createTestPlatformRuntime();

  function LocalizationProbe() {
    const localization = useLocalization();

    return createElement('span', {
      'data-same': localization === runtime.localization ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(LocalizationProbe),
    ),
  );

  assert.match(markup, /data-same="yes"/);
});

test('useFormatter returns exact runtime.formatter', async () => {
  const runtime = await createTestPlatformRuntime();

  function FormatterProbe() {
    const formatter = useFormatter();

    return createElement('span', {
      'data-same': formatter === runtime.formatter ? 'yes' : 'no',
    });
  }

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(FormatterProbe),
    ),
  );

  assert.match(markup, /data-same="yes"/);
});

test('usePresentationContext returns exact localeContext without duplicate model', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'uk-UA', cookieTimeZone: 'Europe/Kyiv' },
  });

  function PresentationContextProbe() {
    const presentationContext = usePresentationContext();

    return createElement('span', {
      'data-same':
        presentationContext === runtime.localization.localeContext
          ? 'yes'
          : 'no',
      'data-locale': presentationContext.locale,
      'data-time-zone': presentationContext.timeZone,
    });
  }

  const markup = renderToString(
    createElement(
      TestPlatformProvider,
      { runtime },
      createElement(PresentationContextProbe),
    ),
  );

  assert.match(markup, /data-same="yes"/);
  assert.match(markup, /data-locale="uk-UA"/);
  assert.match(markup, /data-time-zone="Europe\/Kyiv"/);
});

test('provider source does not store runtime in useState or clone runtime', async () => {
  const source = await readFile(
    new URL('../platform-provider.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('useState'), false);
  assert.equal(source.includes('useMemo'), false);
  assert.equal(source.includes('useEffect'), false);
  assert.equal(source.includes('structuredClone'), false);
  assert.equal(source.includes('JSON.parse'), false);
  assert.equal(source.includes('value: runtime'), true);
});

test('public API does not export internal context, guard, or testing helpers', async () => {
  const source = await readFile(
    new URL('../index.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('PlatformRuntimeContext'), false);
  assert.equal(source.includes('use-required-platform-runtime'), false);
  assert.equal(source.includes('platform-context'), false);
  assert.equal(source.includes('testing'), false);
  assert.equal(source.includes('createTestPlatformRuntime'), false);
});

test('testing entry exports test utilities only', async () => {
  const source = await readFile(
    new URL('../testing/index.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('createTestPlatformRuntime'), true);
  assert.equal(source.includes('TestPlatformProvider'), true);
  assert.equal(source.includes('usePlatformRuntime'), false);
});

test('boundary: react modules do not import Dashboard, Timeline, or Quick Add', async () => {
  const modulePaths = [
    '../platform-provider.ts',
    '../use-platform-runtime.ts',
    '../use-required-platform-runtime.ts',
    '../use-localization.ts',
    '../use-formatter.ts',
    '../use-presentation-context.ts',
    '../index.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes('components/dashboard'), false);
    assert.equal(source.includes('components/timeline'), false);
    assert.equal(source.includes('components/quick-add'), false);
    assert.equal(source.includes('createRequestPlatformRuntime'), false);
    assert.equal(source.includes('next/'), false);
    assert.equal(source.includes('window.'), false);
    assert.equal(source.includes('document.'), false);
    assert.equal(source.includes('cookie'), false);
  }
});

test('boundary: provider and hooks do not import Composition Root or bootstrap', async () => {
  const modulePaths = [
    '../platform-provider.ts',
    '../use-platform-runtime.ts',
    '../use-localization.ts',
    '../use-formatter.ts',
    '../use-presentation-context.ts',
  ];

  for (const modulePath of modulePaths) {
    const source = await readFile(new URL(modulePath, import.meta.url), 'utf8');

    assert.equal(source.includes('createPlatformRuntime'), false);
    assert.equal(source.includes('createRequestPlatformRuntime'), false);
    assert.equal(source.includes('createWebPlatformRuntime'), false);
    assert.equal(source.includes('@diabetes-universe/platform-web'), false);
    assert.equal(source.includes('presentation/client'), false);
    assert.equal(source.includes('resolveBrowserTimeZone'), false);
  }
});

test('boundary: server bootstrap does not import React integration', async () => {
  const source = await readFile(
    new URL('../../create-request-platform-runtime.ts', import.meta.url),
    'utf8',
  );

  assert.equal(source.includes('platform/react'), false);
  assert.equal(source.includes('PlatformProvider'), false);
  assert.equal(source.includes('usePlatformRuntime'), false);
});

test('createTestPlatformRuntime produces a ready runtime for explicit overrides', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });

  assert.equal(typeof runtime.localization.translate, 'function');
  assert.equal(typeof runtime.formatter.formatNumber, 'function');
  assert.equal(runtime.localization.localeContext.locale, 'de-DE');
});

test('createTestPlatformRuntime does not mutate caller input', async () => {
  const request = Object.freeze({
    acceptLanguage: 'uk-UA',
    cookieTimeZone: 'Europe/Kyiv',
  });
  const snapshot = { ...request };

  await createTestPlatformRuntime({ request });

  assert.deepEqual(request, snapshot);
});

test('SSR render does not require browser globals', async () => {
  const runtime = await createTestPlatformRuntime();
  const originalWindow = globalThis.window;

  delete globalThis.window;

  try {
    const markup = renderToString(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(RuntimeProbe),
      ),
    );

    assert.match(markup, /data-locale="en-GB"/);
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
