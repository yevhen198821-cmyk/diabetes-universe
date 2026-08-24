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
import { DashboardHeader } from './dashboard-header.tsx';

after(() => {
  teardownIntegrationDom();
});

test('dashboard header renders localized English copy inside platform provider', async () => {
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
        createElement(DashboardHeader, {
          referenceTime: new Date('2026-08-01T12:00:00.000Z'),
          state: 'ready',
          user: { displayName: 'Anna Example' },
        }),
      ),
    );
  });

  try {
    const brandLogo = document.querySelector(
      'img[src="/brand/diabetes-universe-logo.png"]',
    );
    assert.ok(brandLogo);
    assert.equal(brandLogo.getAttribute('alt'), 'Diabetes Universe');
    assert.equal(document.body.textContent?.includes('Diabetes'), false);
    assert.equal(document.body.textContent?.includes('Universe'), false);
    assert.equal(
      document.body.textContent?.includes('Добавить событие'),
      false,
    );
    assert.equal(
      document.querySelector('button[aria-label="Add event"]'),
      null,
    );
    assert.equal(document.querySelector('time[dateTime]') !== null, true);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});
