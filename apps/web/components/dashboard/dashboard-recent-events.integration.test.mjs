import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import * as React from 'react';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import test from 'node:test';

import { deriveDashboardQuickAddBlocks } from '../../lib/dashboard/dashboard-quick-add-integration-model.ts';
import { deriveDashboardRecentEventSources } from '../../lib/dashboard/dashboard-recent-events-derivation.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { DashboardRecentEvents } from './dashboard-recent-events.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const migratedRecentEventsSources = [
  'dashboard-recent-events-model.ts',
  'dashboard-recent-events.tsx',
  'dashboard-recent-events-labels.ts',
  '../../lib/dashboard/dashboard-recent-events-derivation.ts',
];

const readyEvent = {
  category: 'insulin',
  context: 'Before breakfast',
  dateTime: '2026-08-02T05:05:00.000Z',
  displayTime: '08:05',
  id: 'insulin-0805',
  title: 'NovoRapid',
  unit: 'ЕД',
  value: '4',
};

after(() => {
  teardownIntegrationDom();
});

test('dashboard recent events renders localized English copy inside platform provider', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  globalThis.React = React;

  try {
    const html = renderToString(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardRecentEvents, {
          events: [readyEvent],
          state: 'ready',
          viewAllHref: '/timeline',
        }),
      ),
    );

    assert.match(html, /Recent events/);
    assert.match(html, /All events/);
    assert.match(html, /Insulin/);
    assert.match(html, /NovoRapid/);
    assert.match(html, /4/);
    assert.match(html, /08:05/);
    assert.equal(html.includes('Недавние события'), false);
  } finally {
    delete globalThis.React;
  }
});

test('dashboard recent events loading state announces localized status', async () => {
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
        createElement(DashboardRecentEvents, {
          state: 'loading',
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Loading recent events/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('dashboard recent events fails fast without platform provider', () => {
  assert.throws(
    () =>
      renderToString(
        createElement(DashboardRecentEvents, { state: 'loading' }),
      ),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.match(error.message, /PlatformProvider is required/);
      return true;
    },
  );
});

test('deriveDashboardRecentEventSources invokes formatTime callback once per mappable event', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const formatter = runtime.formatter;
  const formatCalls = [];

  const events = deriveDashboardRecentEventSources(
    [
      {
        dateTime: '2026-08-02T08:05:00.000Z',
        id: 'insulin-0805',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 ЕД',
      },
      {
        dateTime: '2026-08-02T07:15:00.000Z',
        id: 'glucose-1015',
        kind: 'glucose',
        title: 'Glucose',
        value: '7,3 ммоль/л',
      },
      {
        dateTime: '2026-08-02T08:20:00.000Z',
        id: 'nutrition-0820',
        kind: 'nutrition',
        title: 'Breakfast',
        value: '42 г углеводов',
      },
    ],
    {
      formatDisplayTime: (dateTime) => {
        formatCalls.push(dateTime);
        return formatter.formatTime(dateTime, { timeStyle: 'short' });
      },
    },
  );

  assert.equal(formatCalls.length, 2);
  assert.deepEqual(formatCalls, [
    '2026-08-02T08:20:00.000Z',
    '2026-08-02T08:05:00.000Z',
  ]);
  assert.equal(events[0]?.id, 'nutrition-0820');
  assert.equal(events[1]?.id, 'insulin-0805');
});

test('deriveDashboardQuickAddBlocks passes displayTime through unchanged', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: [
        {
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-0805',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
      ],
    },
    {
      formatRecentEventDisplayTime: () => 'formatted-once',
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.recentEvents[0]?.displayTime, 'formatted-once');
  assert.equal(blocks.recentEvents[0]?.title, 'NovoRapid');
  assert.equal(blocks.recentEvents[0]?.value, '4');
});

test('migrated recent events sources do not call Intl directly', () => {
  for (const relativePath of migratedRecentEventsSources) {
    const source = readFileSync(join(currentDirectory, relativePath), 'utf8');

    assert.equal(
      source.includes('Intl.'),
      false,
      `${relativePath} must not use Intl directly`,
    );
  }
});
