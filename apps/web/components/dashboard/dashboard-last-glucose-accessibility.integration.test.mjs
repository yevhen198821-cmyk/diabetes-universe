import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import { TestDiabetesSettingsProvider } from '../../lib/medical/react/testing/test-diabetes-settings-provider.tsx';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { liftLegacyTestFixture } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { DashboardLastGlucose } from './dashboard-last-glucose.tsx';

after(() => {
  teardownIntegrationDom();
});

async function renderReadyLastGlucose(
  targetRange = {
    lowMmolPerL: 3.9,
    highMmolPerL: 7.8,
    source: 'personalized',
  },
) {
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
              displayTime: '08:00',
              event: liftLegacyTestFixture({
                context: 'Before breakfast',
                dateTime: '2026-08-02T08:00:00.000Z',
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
              targetRange,
            },
            referenceTime: new Date('2026-08-02T10:00:00.000Z'),
            state: 'ready',
          }),
        ),
      ),
    );
  });

  return {
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
  };
}

test('ready measurement aria-label includes only the formatted measurement', async () => {
  const view = await renderReadyLastGlucose();

  try {
    const measurement = document.querySelector('p[aria-label]');

    assert.notEqual(measurement, null);
    assert.match(measurement?.getAttribute('aria-label') ?? '', /6\.4 mmol\/L/);
    assert.equal(
      measurement?.getAttribute('aria-label')?.includes('In your range'),
      false,
    );
    assert.equal(
      measurement?.getAttribute('aria-label')?.includes('08:00'),
      false,
    );
    assert.equal(
      measurement?.getAttribute('aria-label')?.includes('Manual entry'),
      false,
    );
  } finally {
    await view.cleanup();
  }
});

test('ready range text remains visible when a target range exists', async () => {
  const view = await renderReadyLastGlucose();

  try {
    assert.match(document.body.textContent ?? '', /In your range/);
  } finally {
    await view.cleanup();
  }
});

test('ready state does not invent range text without a configured target', async () => {
  const view = await renderReadyLastGlucose(null);

  try {
    assert.equal(document.body.textContent?.includes('In your range'), false);
    assert.equal(document.body.textContent?.includes('Below range'), false);
    assert.equal(document.body.textContent?.includes('Above range'), false);
  } finally {
    await view.cleanup();
  }
});

test('suspect quality suppresses range text while keeping the measurement visible', async () => {
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
              displayTime: '08:00',
              event: liftLegacyTestFixture({
                context: 'Before breakfast',
                dateTime: '2099-01-01T08:00:00.000Z',
                id: 'glucose-future',
                kind: 'glucose',
                title: 'Glucose',
                value: '6.4 mmol/L',
              }),
            },
            glucosePresentation: {
              formatter: runtime.formatter,
              glucoseDisplayUnit: 'mmol_per_l',
              localization: runtime.localization,
              targetRange: {
                highMmolPerL: 7.8,
                lowMmolPerL: 3.9,
                source: 'personalized',
              },
            },
            referenceTime: new Date('2026-08-02T10:00:00.000Z'),
            state: 'ready',
          }),
        ),
      ),
    );
  });

  try {
    assert.match(document.body.textContent ?? '', /6\.4/);
    assert.equal(document.body.textContent?.includes('In your range'), false);
    assert.equal(document.body.textContent?.includes('Below range'), false);
    assert.equal(document.body.textContent?.includes('Above range'), false);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('loading and empty states keep accessible status messaging', async () => {
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
          createElement(DashboardLastGlucose, { state: 'loading' }),
        ),
      ),
    );
  });

  assert.match(
    document.body.textContent ?? '',
    /Loading last glucose measurement/,
  );

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(
          TestDiabetesSettingsProvider,
          { glucoseDisplayUnit: 'mmol_per_l' },
          createElement(DashboardLastGlucose, {
            onAddGlucose: () => {},
            state: 'empty',
          }),
        ),
      ),
    );
  });

  assert.match(document.body.textContent ?? '', /No measurements yet/);

  await act(async () => {
    root.unmount();
  });
  container.remove();
  teardownIntegrationDom();
});
