import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../react/testing/create-test-platform-runtime.ts';
import { usePlatformRuntime } from '../../react/use-platform-runtime.ts';
import { APPLICATION_PLATFORM_READY_SELECTOR } from '../application-platform-ready-marker.ts';
import { ApplicationRuntimeGate } from '../application-runtime-gate.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from './integration-dom-setup.mjs';

after(() => {
  teardownIntegrationDom();
});

const READY_BOOTSTRAP = Object.freeze({
  status: 'ready',
  snapshot: Object.freeze({
    language: 'en',
    locale: 'en-GB',
    timeZone: 'Europe/London',
    hourCycle: 'h23',
  }),
});

const TIME_ZONE_REQUIRED_BOOTSTRAP = Object.freeze({
  status: 'time-zone-required',
  seed: Object.freeze({
    language: 'en',
    locale: 'en-GB',
    hourCycle: 'h23',
  }),
});

async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

async function waitForSelector(selector, maxAttempts = 20) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (document.querySelector(selector) !== null) {
      return;
    }

    await flushAsyncWork();
  }

  throw new Error(`Timed out waiting for selector: ${selector}`);
}

async function mountGate(element) {
  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });

  return {
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

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

test('pending gate state does not mount AppProviders', async () => {
  const mounted = await mountGate(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap: READY_BOOTSTRAP,
        runtimeBootstrapper: () => new Promise(() => {}),
      },
      createElement('div', { 'data-testid': 'product-child' }, 'product'),
    ),
  );

  try {
    await flushAsyncWork();
    assert.equal(document.querySelector('[data-testid="product-child"]'), null);
    assert.notEqual(
      document.querySelector('[data-testid="application-bootstrap-pending"]'),
      null,
    );
    assert.equal(
      document.querySelector(APPLICATION_PLATFORM_READY_SELECTOR),
      null,
    );
  } finally {
    await mounted.unmount();
    teardownIntegrationDom();
  }
});

test('ready gate mounts product child exactly once', async () => {
  const runtime = await createTestPlatformRuntime();
  let productMountCount = 0;

  function ProductChild() {
    productMountCount += 1;
    return createElement('div', { 'data-testid': 'product-child' }, 'product');
  }

  const mounted = await mountGate(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap: READY_BOOTSTRAP,
        runtimeBootstrapper: async () => ({ status: 'ready', runtime }),
      },
      createElement(ProductChild),
    ),
  );

  try {
    await waitForSelector('[data-testid="product-child"]');
    assert.equal(productMountCount, 1);
    assert.notEqual(
      document.querySelector(APPLICATION_PLATFORM_READY_SELECTOR),
      null,
    );
  } finally {
    await mounted.unmount();
    teardownIntegrationDom();
  }
});

test('platform hooks are available from the first product render', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  function RuntimeProbe() {
    const observed = usePlatformRuntime();

    return createElement('span', {
      'data-testid': 'runtime-probe',
      'data-locale': observed.localization.localeContext.locale,
    });
  }

  const mounted = await mountGate(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap: READY_BOOTSTRAP,
        runtimeBootstrapper: async () => ({ status: 'ready', runtime }),
      },
      createElement(RuntimeProbe),
    ),
  );

  try {
    await waitForSelector('[data-testid="runtime-probe"]');
    assert.equal(
      document
        .querySelector('[data-testid="runtime-probe"]')
        ?.getAttribute('data-locale'),
      'en-GB',
    );
  } finally {
    await mounted.unmount();
    teardownIntegrationDom();
  }
});

test('infrastructure error renders safe error state without product tree', async () => {
  const mounted = await mountGate(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap: READY_BOOTSTRAP,
        runtimeBootstrapper: async () => {
          throw new Error('infrastructure failure');
        },
      },
      createElement('div', { 'data-testid': 'product-child' }, 'product'),
    ),
  );

  try {
    await waitForSelector('[data-testid="application-bootstrap-error"]');
    assert.equal(document.querySelector('[data-testid="product-child"]'), null);
    assert.equal(
      document.querySelector(APPLICATION_PLATFORM_READY_SELECTOR),
      null,
    );
    assert.equal(
      document.body.textContent?.includes('infrastructure failure'),
      false,
    );
  } finally {
    await mounted.unmount();
    teardownIntegrationDom();
  }
});

test('browser TZ unavailable gate does not render product tree', async () => {
  await withMockedBrowserTimeZone('Invalid/Zone', async () => {
    const mounted = await mountGate(
      createElement(
        ApplicationRuntimeGate,
        {
          bootstrap: TIME_ZONE_REQUIRED_BOOTSTRAP,
        },
        createElement('div', { 'data-testid': 'product-child' }, 'product'),
      ),
    );

    try {
      await waitForSelector(
        '[data-testid="application-bootstrap-unavailable"]',
      );
      assert.equal(
        document.querySelector('[data-testid="product-child"]'),
        null,
      );
      assert.equal(
        document.querySelector(APPLICATION_PLATFORM_READY_SELECTOR),
        null,
      );
    } finally {
      await mounted.unmount();
      teardownIntegrationDom();
    }
  });
});

test('unmount before runtime assembly completes does not update gate state', async () => {
  let resolveRuntime;
  const runtimePromise = new Promise((resolve) => {
    resolveRuntime = resolve;
  });

  const mounted = await mountGate(
    createElement(
      ApplicationRuntimeGate,
      {
        bootstrap: READY_BOOTSTRAP,
        runtimeBootstrapper: async () => runtimePromise,
      },
      createElement('div', { 'data-testid': 'product-child' }, 'product'),
    ),
  );

  await mounted.unmount();

  await act(async () => {
    resolveRuntime({
      status: 'ready',
      runtime: await createTestPlatformRuntime(),
    });
    await flushAsyncWork();
  });

  assert.equal(document.querySelector('[data-testid="product-child"]'), null);
  teardownIntegrationDom();
});
