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
import { DashboardLastGlucose } from './dashboard-last-glucose.tsx';

after(() => {
  teardownIntegrationDom();
});

async function renderLastGlucose(props) {
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
          createElement(DashboardLastGlucose, props),
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
    container,
  };
}

test('empty state renders localized Add glucose CTA', async () => {
  const view = await renderLastGlucose({
    onAddGlucose: () => {},
    state: 'empty',
  });

  try {
    const button = document.querySelector('button');

    assert.notEqual(button, null);
    assert.match(button?.textContent ?? '', /Add glucose/);
    assert.match(document.body.textContent ?? '', /No measurements yet/);
  } finally {
    await view.cleanup();
  }
});

test('empty CTA click invokes Quick Add entry callback', async () => {
  let callCount = 0;
  const view = await renderLastGlucose({
    onAddGlucose: () => {
      callCount += 1;
    },
    state: 'empty',
  });

  try {
    const button = document.querySelector('button');

    assert.notEqual(button, null);
    await act(async () => {
      button?.click();
    });
    assert.equal(callCount, 1);
  } finally {
    await view.cleanup();
  }
});

test('empty CTA is keyboard focusable and activatable', async () => {
  let callCount = 0;
  const view = await renderLastGlucose({
    onAddGlucose: () => {
      callCount += 1;
    },
    state: 'empty',
  });

  try {
    const button = document.querySelector('button');

    assert.notEqual(button, null);
    button?.focus();
    await act(async () => {
      button?.click();
    });
    assert.equal(callCount, 1);
  } finally {
    await view.cleanup();
  }
});

test('loading state does not render empty CTA', async () => {
  const view = await renderLastGlucose({ state: 'loading' });

  try {
    assert.equal(document.querySelector('button'), null);
  } finally {
    await view.cleanup();
  }
});

test('error state does not render empty CTA', async () => {
  const view = await renderLastGlucose({ state: 'error' });

  try {
    assert.equal(document.querySelector('button'), null);
    assert.match(
      document.body.textContent ?? '',
      /Could not load the last measurement/,
    );
  } finally {
    await view.cleanup();
  }
});

test('ready state does not render empty CTA', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const view = await renderLastGlucose({
    glucose: {
      displayTime: '08:00',
      event: {
        concentrationMmolPerL: 6.4,
        context: 'before_meal',
        id: 'glucose-test',
        kind: 'glucose',
        occurredAt: '2026-08-02T05:00:00.000Z',
        source: 'manual',
      },
    },
    glucosePresentation: {
      formatter: runtime.formatter,
      glucoseDisplayUnit: 'mmol_per_l',
      localization: runtime.localization,
      targetRange: null,
    },
    state: 'ready',
  });

  try {
    assert.equal(document.querySelector('button'), null);
  } finally {
    await view.cleanup();
  }
});

test('localized empty CTA labels render for RU, UK, and DE', async () => {
  for (const [locale, label] of [
    ['ru-RU', 'Добавить глюкозу'],
    ['uk-UA', 'Додати глюкозу'],
    ['de-DE', 'Glukose hinzufügen'],
  ]) {
    const runtime = await createTestPlatformRuntime({
      request: { acceptLanguage: locale, cookieTimeZone: 'UTC' },
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
              onAddGlucose: () => {},
              state: 'empty',
            }),
          ),
        ),
      );
    });

    try {
      assert.match(document.body.textContent ?? '', new RegExp(label));
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    }
  }
});
