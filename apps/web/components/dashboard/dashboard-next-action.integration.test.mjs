import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { DashboardNextAction } from './dashboard-next-action.tsx';

after(() => {
  teardownIntegrationDom();
});

test('dashboard next action renders localized English copy inside platform provider', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardNextAction, {
          action: {
            actionLabel: 'Add',
            description: 'Add insulin',
            title: 'Next action',
          },
          onAction: () => {},
          state: 'ready',
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Next action/);
    assert.match(document.body.textContent ?? '', /Add insulin/);
    assert.match(document.body.textContent ?? '', /Add/);
    assert.equal(
      document.body.textContent?.includes('Следующее действие'),
      false,
    );
    assert.equal(document.querySelector('button')?.textContent?.trim(), 'Add');
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('dashboard next action loading state announces localized status', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardNextAction, {
          state: 'loading',
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Loading next action/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});
