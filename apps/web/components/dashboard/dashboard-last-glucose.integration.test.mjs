import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { deriveDashboardQuickAddBlocks } from '../../lib/dashboard/dashboard-quick-add-integration-model.ts';
import { formatDashboardGlucoseDisplayTime } from '../../lib/dashboard/format-dashboard-glucose-display-time.ts';
import { createTimelinePresentationDependencies } from '../../lib/timeline/presentation/index.ts';
import {
  liftLegacyTestFixture,
  liftLegacyTestFixtures,
} from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../../lib/timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import { TestDiabetesSettingsProvider } from '../../lib/medical/react/testing/test-diabetes-settings-provider.tsx';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { DashboardLastGlucose } from './dashboard-last-glucose.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const migratedLastGlucoseSources = [
  'dashboard-last-glucose-model.ts',
  'dashboard-last-glucose.tsx',
  'dashboard-last-glucose-labels.ts',
];

after(() => {
  teardownIntegrationDom();
});

test('dashboard last glucose renders localized English copy inside platform provider', async () => {
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
        createElement(
          TestDiabetesSettingsProvider,
          { glucoseDisplayUnit: 'mmol_per_l' },
          createElement(DashboardLastGlucose, {
            glucose: {
              displayTime: '06:00',
              event: liftLegacyTestFixture({
                context: 'Before breakfast',
                dateTime: '2026-08-02T05:00:00.000Z',
                id: 'glucose-test',
                kind: 'glucose',
                title: 'Glucose',
                value: '6.4 mmol/L',
              }),
            },
            glucosePresentation: {
              formatter: runtime.formatter,
              glucoseDisplayUnit: 'mmol_per_l',
              localization: runtime.localization,
              targetRange: null,
            },
            state: 'ready',
          }),
        ),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /Last glucose/);
    assert.match(document.body.textContent ?? '', /6\.4/);
    assert.match(document.body.textContent ?? '', /mmol\/L/);
    assert.equal(
      document.body.textContent?.includes('Последняя глюкоза'),
      false,
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

test('dashboard last glucose loading state announces localized status', async () => {
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
        createElement(
          TestDiabetesSettingsProvider,
          { glucoseDisplayUnit: 'mmol_per_l' },
          createElement(DashboardLastGlucose, {
            state: 'loading',
          }),
        ),
      ),
    );
  });

  try {
    assert.match(
      document.body.textContent ?? '',
      /Loading last glucose measurement/,
    );
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('deriveLastGlucose uses dashboard glucose display-time policy for same-day readings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'UTC' },
  });
  const formatter = runtime.formatter;
  const presentationDependencies = createTimelinePresentationDependencies({
    formatter: runtime.formatter,
    localization: runtime.localization,
  });
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Before breakfast',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Glucose',
          value: '6,4 ммоль/л',
        },
      ]),
    },
    {
      formatLastGlucoseDisplayTime: (dateTime) =>
        formatDashboardGlucoseDisplayTime({
          formatter,
          labels: {
            justNow: 'Just now',
            today: 'Today',
            yesterday: 'Yesterday',
          },
          measuredAt: dateTime,
          referenceTime: new Date('2026-08-02T10:00:00.000Z'),
          timeZone: 'UTC',
        }),
      referenceTime: new Date('2026-08-02T10:00:00.000Z'),
      timeZone: 'UTC',
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.event.concentrationMmolPerL, 6.4);
  assert.equal(blocks.lastGlucose?.displayTime, 'Today, 08:00');
  assert.equal(
    blocks.lastGlucose?.event.occurredAt,
    '2026-08-02T08:00:00.000Z',
  );
});

test('deriveLastGlucose passes display time through to view model unchanged', async () => {
  const presentationDependencies =
    await createTestTimelinePresentationDependencies();
  const blocks = deriveDashboardQuickAddBlocks(
    {
      events: liftLegacyTestFixtures([
        {
          context: 'Before breakfast',
          dateTime: '2026-08-02T08:00:00.000Z',
          id: 'glucose-0800',
          kind: 'glucose',
          title: 'Glucose',
          value: '6,4 ммоль/л',
        },
      ]),
    },
    {
      formatLastGlucoseDisplayTime: () => 'formatted-once',
      referenceTime: new Date('2026-08-02T10:00:00.000Z'),
      presentationDependencies,
    },
  );

  assert.equal(blocks.lastGlucose?.displayTime, 'formatted-once');
});

test('deriveLastGlucose path does not import formatTimelineDisplayTime', () => {
  const source = readFileSync(
    join(
      currentDirectory,
      '../../lib/dashboard/dashboard-quick-add-integration-model.ts',
    ),
    'utf8',
  );

  assert.equal(source.includes('formatTimelineDisplayTime'), false);
});

test('migrated last glucose sources do not call Intl directly', () => {
  for (const relativePath of migratedLastGlucoseSources) {
    const source = readFileSync(join(currentDirectory, relativePath), 'utf8');

    assert.equal(
      source.includes('Intl.'),
      false,
      `${relativePath} must not use Intl directly`,
    );
  }
});
