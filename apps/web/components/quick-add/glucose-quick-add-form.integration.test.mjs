import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { GlucoseQuickAddForm } from './glucose-quick-add-form.tsx';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import { TestDiabetesSettingsProvider } from '../../lib/medical/react/testing/test-diabetes-settings-provider.tsx';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { resolveGlucoseContextOptions } from './glucose-quick-add-labels.ts';
import { DiabetesSettingsClientError } from '../../lib/medical/client/diabetes-settings-types.ts';

after(() => {
  teardownIntegrationDom();
});

async function renderGlucoseForm({
  glucoseDisplayUnit = 'mmol_per_l',
  loadState = 'ready',
  error = null,
  onRefresh = async () => {},
} = {}) {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });
  const initialFocusRef = createRef();

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
          {
            error,
            glucoseDisplayUnit,
            loadState,
            onRefresh,
          },
          createElement(GlucoseQuickAddForm, {
            initialFocusRef,
            onCancel: () => {},
            onSubmit: () => {},
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

test('optional context starts hidden behind add-context control', async () => {
  const view = await renderGlucoseForm();

  try {
    assert.notEqual(
      document.querySelector('button[aria-label="Add context"]'),
      null,
    );
    assert.equal(
      document.querySelector('#quick-add-glucose-context-value'),
      null,
    );
  } finally {
    await view.cleanup();
  }
});

test('localized labels do not determine semantic context values', () => {
  const runtimePromise = createTestPlatformRuntime({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });

  return runtimePromise.then((runtime) => {
    const options = resolveGlucoseContextOptions(runtime.localization);

    assert.deepEqual(
      options.map((option) => option.id),
      ['fasting', 'before_meal', 'after_meal', 'bedtime', 'other'],
    );
    assert.match(options[0]?.label ?? '', /Натощак/);
    assert.equal(options[0]?.id, 'fasting');
    assert.equal(options[1]?.id, 'before_meal');
  });
});

test('configured mmol/L enables value input with suffix', async () => {
  const view = await renderGlucoseForm({ glucoseDisplayUnit: 'mmol_per_l' });

  try {
    const valueInput = document.getElementById('quick-add-glucose-value');
    assert.notEqual(valueInput, null);
    assert.equal(valueInput?.disabled, false);
    assert.match(document.body.textContent ?? '', /mmol\/L/);
  } finally {
    await view.cleanup();
  }
});

test('configured mg/dL enables value input with suffix', async () => {
  const view = await renderGlucoseForm({ glucoseDisplayUnit: 'mg_per_dl' });

  try {
    const valueInput = document.getElementById('quick-add-glucose-value');
    assert.notEqual(valueInput, null);
    assert.equal(valueInput?.disabled, false);
    assert.match(document.body.textContent ?? '', /mg\/dL/);
    assert.equal(valueInput?.getAttribute('inputmode'), 'numeric');
  } finally {
    await view.cleanup();
  }
});

test('settings loading does not show unconfigured gate', async () => {
  const view = await renderGlucoseForm({ loadState: 'loading' });

  try {
    assert.match(document.body.textContent ?? '', /Loading glucose settings/);
    assert.doesNotMatch(
      document.body.textContent ?? '',
      /Glucose unit not configured/,
    );
    assert.equal(
      document.getElementById('quick-add-glucose-value')?.disabled,
      true,
    );
  } finally {
    await view.cleanup();
  }
});

test('unconfigured state blocks entry and links to diabetes settings', async () => {
  const view = await renderGlucoseForm({ glucoseDisplayUnit: null });

  try {
    assert.match(
      document.body.textContent ?? '',
      /Glucose unit not configured/,
    );
    assert.equal(
      document.getElementById('quick-add-glucose-value')?.disabled,
      true,
    );
    const link = document.querySelector('a[href="/account/diabetes"]');
    assert.notEqual(link, null);
    assert.match(link?.textContent ?? '', /Open Diabetes settings/);
  } finally {
    await view.cleanup();
  }
});

test('settings error blocks entry and retry calls refresh', async () => {
  let refreshCount = 0;
  const view = await renderGlucoseForm({
    error: new DiabetesSettingsClientError(
      'network',
      'Network request failed.',
    ),
    loadState: 'error',
    onRefresh: async () => {
      refreshCount += 1;
    },
  });

  try {
    assert.match(
      document.body.textContent ?? '',
      /Could not load glucose settings/,
    );
    assert.equal(
      document.getElementById('quick-add-glucose-value')?.disabled,
      true,
    );

    const retryButton = [...document.querySelectorAll('button')].find(
      (button) => button.textContent?.includes('Retry'),
    );
    assert.notEqual(retryButton, undefined);

    await act(async () => {
      retryButton?.click();
    });

    assert.equal(refreshCount, 1);
  } finally {
    await view.cleanup();
  }
});
