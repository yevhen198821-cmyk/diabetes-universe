import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import test from 'node:test';

import { deriveDashboardQuickAddBlocks } from '../../lib/dashboard/dashboard-quick-add-integration-model.ts';
import { liftLegacyTestFixtures } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { DashboardDaySummary } from './dashboard-day-summary.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const migratedDaySummarySources = [
  'dashboard-day-summary-model.ts',
  'dashboard-day-summary.tsx',
  'dashboard-day-summary-labels.ts',
];

const readySummary = {
  dayDate: '2026-08-02',
  displayDayLabel: 'Sunday, 2 August 2026',
  glucoseMeasurements: 4,
  medicationDoses: 2,
  remindersCompleted: 1,
  remindersTotal: 3,
  totalCarbohydrates: '120 г',
  totalInsulin: '12 ЕД',
};

after(() => {
  teardownIntegrationDom();
});

test('dashboard day summary renders localized English copy inside platform provider', async () => {
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
        createElement(DashboardDaySummary, {
          state: 'ready',
          summary: readySummary,
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Day summary/);
    assert.match(document.body.textContent ?? '', /Current day/);
    assert.match(document.body.textContent ?? '', /Glucose measurements/);
    assert.match(document.body.textContent ?? '', /Total insulin/);
    assert.match(document.body.textContent ?? '', /Total carbohydrates/);
    assert.match(document.body.textContent ?? '', /Medication doses/);
    assert.match(document.body.textContent ?? '', /Reminders/);
    assert.match(document.body.textContent ?? '', /Sunday, 2 August 2026/);
    assert.equal(document.body.textContent?.includes('Сводка дня'), false);
    assert.equal(document.querySelector('time[dateTime]') !== null, true);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('dashboard day summary loading state announces localized status', async () => {
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
        createElement(DashboardDaySummary, {
          state: 'loading',
        }),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Loading day summary/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('dashboard day summary fails fast without platform provider', () => {
  assert.throws(
    () =>
      renderToString(createElement(DashboardDaySummary, { state: 'loading' })),
    (error) => {
      assert.equal(error instanceof Error, true);
      assert.match(error.message, /PlatformProvider is required/);
      return true;
    },
  );
});

test('deriveDaySummary invokes formatDate callback exactly once with referenceTime', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const formatter = runtime.formatter;
  const referenceTime = new Date('2026-08-02T10:00:00.000Z');
  let formatDateCalls = 0;
  let receivedDate = null;

  const blocks = deriveDashboardQuickAddBlocks(
    { events: [] },
    {
      formatDaySummaryDisplayDate: (date) => {
        formatDateCalls += 1;
        receivedDate = date;
        return formatter.formatDate(date, { dateStyle: 'full' });
      },
      referenceTime,
      timeZone: 'UTC',
    },
  );

  assert.equal(formatDateCalls, 1);
  assert.equal(receivedDate, referenceTime);
  assert.equal(blocks.daySummary?.dayDate, '2026-08-02');
  assert.match(blocks.daySummary?.displayDayLabel ?? '', /August/i);
});

test('deriveDaySummary keeps dayDate independent from display label formatting', () => {
  const referenceTime = new Date('2026-08-02T10:00:00.000Z');

  const blocks = deriveDashboardQuickAddBlocks(
    { events: [] },
    {
      formatDaySummaryDisplayDate: () => 'custom-display-label',
      referenceTime,
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.daySummary?.dayDate, '2026-08-02');
  assert.equal(blocks.daySummary?.displayDayLabel, 'custom-display-label');
});

test('deriveDaySummary passes insulin and carbohydrate totals through unchanged', () => {
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Today',
          dateTime: '2026-08-02T08:05:00.000Z',
          id: 'insulin-today',
          kind: 'insulin',
          title: 'NovoRapid',
          value: '4 ЕД',
        },
        {
          context: 'Today',
          dateTime: '2026-08-02T08:20:00.000Z',
          id: 'nutrition-today',
          kind: 'nutrition',
          title: 'Breakfast',
          value: '42 г углеводов',
        },
      ]),
    },
    {
      formatDaySummaryDisplayDate: () => 'Sunday, 2 August 2026',
      referenceTime: new Date('2026-08-02T10:00:00.000Z'),
      timeZone: 'UTC',
    },
  );

  assert.equal(blocks.daySummary?.totalInsulin, '4 ЕД');
  assert.equal(blocks.daySummary?.totalCarbohydrates, '42 г');
});

test('dashboard day summary formats counters with platform formatter', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const formatter = runtime.formatter;
  let formatNumberCalls = 0;

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const originalFormatNumber = formatter.formatNumber.bind(formatter);

  formatter.formatNumber = (value) => {
    formatNumberCalls += 1;
    return originalFormatNumber(value);
  };

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(DashboardDaySummary, {
          state: 'ready',
          summary: readySummary,
        }),
      ),
    );
  });

  try {
    assert.equal(formatNumberCalls >= 4, true);
    assert.match(document.body.textContent ?? '', /1 \/ 3/);
    assert.match(document.body.textContent ?? '', /12 ЕД/);
    assert.match(document.body.textContent ?? '', /120 г/);
  } finally {
    formatter.formatNumber = originalFormatNumber;
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('migrated day summary sources do not call Intl directly', () => {
  for (const relativePath of migratedDaySummarySources) {
    const source = readFileSync(join(currentDirectory, relativePath), 'utf8');

    assert.equal(
      source.includes('Intl.'),
      false,
      `${relativePath} must not use Intl directly`,
    );
  }
});
