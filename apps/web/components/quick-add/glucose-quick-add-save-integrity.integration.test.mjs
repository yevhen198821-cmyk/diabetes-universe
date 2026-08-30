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

after(() => {
  teardownIntegrationDom();
});

async function renderGlucoseForm({
  draftState = {
    context: undefined,
    time: '08:30',
    value: '6.1',
  },
  onSubmit = async () => {},
  onCancel = () => {},
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
          { glucoseDisplayUnit: 'mmol_per_l' },
          createElement(GlucoseQuickAddForm, {
            draftState,
            initialFocusRef,
            onCancel,
            onSubmit,
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
    getSaveButton() {
      return [...document.querySelectorAll('button')].find((button) =>
        /^(Save|Saving…)$/.test(button.textContent ?? ''),
      );
    },
    getValueInput() {
      return document.getElementById('quick-add-glucose-value');
    },
  };
}

async function clickSave(view) {
  const saveButton = view.getSaveButton();
  assert.notEqual(saveButton, undefined);

  await act(async () => {
    saveButton?.click();
    await Promise.resolve();
  });
}

test('pending save keeps form open and disables save', async () => {
  let resolveSubmit;
  const submitPromise = new Promise((resolve) => {
    resolveSubmit = resolve;
  });
  const view = await renderGlucoseForm({
    onSubmit: () => submitPromise,
  });

  try {
    await clickSave(view);

    assert.match(document.body.textContent ?? '', /Saving…/);
    assert.equal(view.getSaveButton()?.disabled, true);
    assert.notEqual(document.getElementById('quick-add-glucose-saving'), null);

    await act(async () => {
      resolveSubmit();
      await submitPromise;
    });
  } finally {
    await view.cleanup();
  }
});

test('double submit triggers one persistence write with stable event id', async () => {
  let submitCount = 0;
  let firstEventId = null;
  const view = await renderGlucoseForm({
    draftState: {
      context: undefined,
      time: '08:30',
      value: '5.8',
    },
    onSubmit: async ({ eventId }) => {
      submitCount += 1;
      firstEventId ??= eventId;
      assert.equal(eventId, firstEventId);
      await new Promise((resolve) => setTimeout(resolve, 20));
    },
  });

  try {
    const saveButton = view.getSaveButton();
    assert.notEqual(saveButton, undefined);

    await act(async () => {
      saveButton?.click();
      saveButton?.click();
      await Promise.resolve();
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    assert.equal(submitCount, 1);
  } finally {
    await view.cleanup();
  }
});

test('save error keeps form open and preserves entered value', async () => {
  const view = await renderGlucoseForm({
    draftState: {
      context: undefined,
      time: '08:30',
      value: '7.2',
    },
    onSubmit: async () => {
      throw new Error('write failed');
    },
  });

  try {
    await clickSave(view);

    assert.match(
      document.body.textContent ?? '',
      /Could not save glucose reading/,
    );
    assert.equal(view.getValueInput()?.value, '7.2');
    assert.equal(view.getSaveButton()?.disabled, false);
  } finally {
    await view.cleanup();
  }
});

test('retry after error reuses the same logical event identity', async () => {
  const eventIds = [];
  let attempt = 0;
  const view = await renderGlucoseForm({
    draftState: {
      context: undefined,
      time: '08:30',
      value: '6.4',
    },
    onSubmit: async ({ eventId }) => {
      eventIds.push(eventId);
      attempt += 1;

      if (attempt === 1) {
        throw new Error('write failed');
      }
    },
  });

  try {
    await clickSave(view);
    await clickSave(view);

    assert.equal(eventIds.length, 2);
    assert.equal(eventIds[0], eventIds[1]);
  } finally {
    await view.cleanup();
  }
});

test('submit error exposes alert semantics for assistive technologies', async () => {
  const view = await renderGlucoseForm({
    draftState: {
      context: undefined,
      time: '08:30',
      value: '6.0',
    },
    onSubmit: async () => {
      throw new Error('write failed');
    },
  });

  try {
    await clickSave(view);

    const alert = document.querySelector('[role="alert"]');
    assert.notEqual(alert, null);
    assert.match(alert?.textContent ?? '', /not saved/i);
  } finally {
    await view.cleanup();
  }
});
