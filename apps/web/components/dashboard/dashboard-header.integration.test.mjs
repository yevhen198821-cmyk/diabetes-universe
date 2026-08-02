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
          onAddEvent: () => {},
          referenceTime: new Date('2026-08-01T12:00:00.000Z'),
          state: 'ready',
          user: { displayName: 'Anna Example' },
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Diabetes Universe/);
    assert.match(document.body.textContent ?? '', /Add event/);
    assert.equal(
      document.body.textContent?.includes('Добавить событие'),
      false,
    );
    assert.equal(
      document.querySelector('button[aria-label="Add event"]') !== null,
      true,
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
