import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import { InsulinQuickAddForm } from './insulin-quick-add-form.tsx';

/**
 * DOM scope note: this harness runs on happy-dom, where React does not receive
 * `onChange` for controlled text inputs from dispatched events. Click-driven
 * behavior (option sheets, revealed fields, validation that rejects the empty
 * initial state) is covered here; typed dose / Other-name success paths are
 * covered by `apps/web/e2e/insulin-quick-add-wave-4c.spec.ts` in a real browser.
 */

after(() => {
  teardownIntegrationDom();
});

const englishRequest = {
  acceptLanguage: 'en-GB',
  cookieTimeZone: 'Europe/London',
};

async function renderInsulinQuickAddForm({ request = englishRequest } = {}) {
  setupIntegrationDom();

  const runtime = await createTestPlatformRuntime({ request });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const submitted = [];

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(InsulinQuickAddForm, {
          onCancel: () => {},
          onSubmit: async (request) => {
            submitted.push(request.entry);
          },
        }),
      ),
    );
  });

  const field = (id) => document.getElementById(id);

  const clickText = async (text) => {
    const button = [...document.querySelectorAll('button')].find(
      (candidate) => (candidate.textContent ?? '').trim() === text,
    );

    assert.ok(button, `button "${text}" exists`);

    await act(async () => {
      button.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
  };

  const openSheet = async (valueElementId) => {
    await act(async () => {
      field(valueElementId)
        .closest('button')
        .dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });
  };

  return {
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
    clickText,
    field,
    async openContextSheet() {
      await openSheet('quick-add-insulin-context-value');
    },
    async openPreparationSheet() {
      await openSheet('quick-add-insulin-preparation-value');
    },
    sheetText: () =>
      document.querySelector('div[role="dialog"]')?.textContent ?? '',
    async submitForm() {
      await act(async () => {
        document
          .querySelector('form')
          .dispatchEvent(
            new window.Event('submit', { bubbles: true, cancelable: true }),
          );
      });
    },
    submitted,
  };
}

test('insulin quick add chrome is localized in English without Russian strings', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    const body = document.body.textContent ?? '';

    assert.match(body, /Insulin preparation/);
    assert.match(body, /Select an insulin/);
    assert.match(body, /Insulin dose/);
    assert.match(body, /Administration context/);
    assert.match(body, /Select a context/);
    assert.match(body, /Cancel/);
    assert.match(body, /Save/);
    assert.doesNotMatch(body, /[\u0400-\u04ff]/);
  } finally {
    await view.cleanup();
  }
});

test('the preparation sheet offers catalogue options grouped by localized chrome', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openPreparationSheet();

    const sheetText = view.sheetText();

    assert.match(sheetText, /Rapid-acting insulin/);
    assert.match(sheetText, /Long-acting insulin/);
    assert.match(sheetText, /NovoRapid/);
    assert.match(sheetText, /Lantus/);
    assert.match(sheetText, /Other/);
    assert.doesNotMatch(sheetText, /Быстрый инсулин/);
    assert.doesNotMatch(sheetText, /insulin\.prep\./);
  } finally {
    await view.cleanup();
  }
});

test('selecting a catalogue preparation shows its localized snapshot label', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openPreparationSheet();
    await view.clickText('Lantus');

    assert.equal(
      view.field('quick-add-insulin-preparation-value').textContent,
      'Lantus',
    );
    assert.equal(view.field('quick-add-insulin-other-name'), null);
  } finally {
    await view.cleanup();
  }
});

test('the context sheet shows localized semantic options including Not specified', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openContextSheet();

    const sheetText = view.sheetText();

    for (const label of [
      'Before meal',
      'After meal',
      'Correction',
      'Basal',
      'Not specified',
    ]) {
      assert.ok(sheetText.includes(label), `context sheet offers ${label}`);
    }

    assert.doesNotMatch(sheetText, /before_meal/);
    assert.doesNotMatch(sheetText, /unspecified/);
  } finally {
    await view.cleanup();
  }
});

test('selecting a context shows its localized label without exposing the ID', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openContextSheet();
    await view.clickText('Correction');

    const trigger = view.field('quick-add-insulin-context-value');

    assert.equal(trigger.textContent, 'Correction');
    assert.doesNotMatch(trigger.textContent, /correction/);
  } finally {
    await view.cleanup();
  }
});

test('choosing Other reveals a labelled required name field', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    assert.equal(view.field('quick-add-insulin-other-name'), null);

    await view.openPreparationSheet();
    await view.clickText('Other');

    const otherName = view.field('quick-add-insulin-other-name');

    assert.ok(otherName);
    assert.equal(otherName.value, '');

    const label = [...document.querySelectorAll('label')].find(
      (candidate) =>
        candidate.getAttribute('for') === 'quick-add-insulin-other-name',
    );

    assert.ok(label);
    assert.equal(label.textContent, 'Preparation name');
  } finally {
    await view.cleanup();
  }
});

test('switching from Other to a catalogue entry removes the Other name field', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openPreparationSheet();
    await view.clickText('Other');

    assert.ok(view.field('quick-add-insulin-other-name'));

    await view.openPreparationSheet();
    await view.clickText('Fiasp');

    assert.equal(view.field('quick-add-insulin-other-name'), null);
    assert.equal(
      view.field('quick-add-insulin-preparation-value').textContent,
      'Fiasp',
    );
  } finally {
    await view.cleanup();
  }
});

test('an empty Other name blocks submit with a localized accessible error', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openPreparationSheet();
    await view.clickText('Other');
    await view.submitForm();

    assert.equal(view.submitted.length, 0);

    const error = view.field('quick-add-insulin-other-name-error');

    assert.ok(error);
    assert.equal(error.getAttribute('role'), 'alert');
    assert.equal(error.textContent, 'Enter the preparation name.');
    assert.equal(
      view.field('quick-add-insulin-other-name').getAttribute('aria-invalid'),
      'true',
    );
  } finally {
    await view.cleanup();
  }
});

test('an empty dose blocks submit with a localized error free of clinical wording', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    await view.openPreparationSheet();
    await view.clickText('NovoRapid');
    await view.submitForm();

    assert.equal(view.submitted.length, 0);

    const error = view.field('quick-add-insulin-dose-error');

    assert.ok(error);
    assert.equal(error.getAttribute('role'), 'alert');
    assert.match(error.textContent, /two decimal places/);
    assert.equal(/safe|recommend|correct dose/i.test(error.textContent), false);
    assert.equal(
      view.field('quick-add-insulin-dose').getAttribute('aria-invalid'),
      'true',
    );
  } finally {
    await view.cleanup();
  }
});

test('submit stays blocked until a preparation is chosen', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    const submitButton = [...document.querySelectorAll('button')].find(
      (button) => button.getAttribute('type') === 'submit',
    );

    assert.equal(submitButton.disabled, true);

    await view.submitForm();

    assert.equal(view.submitted.length, 0);
    assert.equal(view.field('quick-add-insulin-dose-error'), null);
  } finally {
    await view.cleanup();
  }
});

test('the dose field is never pre-filled with a suggested value', async () => {
  const view = await renderInsulinQuickAddForm();

  try {
    const dose = view.field('quick-add-insulin-dose');

    assert.equal(dose.value, '');
    assert.equal(dose.getAttribute('placeholder'), '4');
    assert.equal(dose.getAttribute('inputmode'), 'decimal');

    const doseLabel = [...document.querySelectorAll('label')].find(
      (candidate) => candidate.getAttribute('for') === 'quick-add-insulin-dose',
    );

    assert.equal(doseLabel.textContent, 'Insulin dose');
  } finally {
    await view.cleanup();
  }
});

test('Russian chrome renders without English insulin form labels', async () => {
  const view = await renderInsulinQuickAddForm({
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });

  try {
    const body = document.body.textContent ?? '';

    assert.match(body, /Препарат инсулина/);
    assert.match(body, /Доза инсулина/);
    assert.match(body, /Контекст введения/);
    assert.doesNotMatch(body, /Insulin preparation/);
    assert.doesNotMatch(body, /Insulin dose/);
  } finally {
    await view.cleanup();
  }
});

test('Ukrainian chrome renders localized insulin form labels', async () => {
  const view = await renderInsulinQuickAddForm({
    request: { acceptLanguage: 'uk-UA', cookieTimeZone: 'Europe/Kyiv' },
  });

  try {
    const body = document.body.textContent ?? '';

    assert.match(body, /Препарат інсуліну/);
    assert.match(body, /Доза інсуліну/);
    assert.match(body, /Контекст введення/);
    assert.doesNotMatch(body, /Insulin dose/);
  } finally {
    await view.cleanup();
  }
});

test('German chrome renders localized insulin form labels', async () => {
  const view = await renderInsulinQuickAddForm({
    request: { acceptLanguage: 'de-DE', cookieTimeZone: 'Europe/Berlin' },
  });

  try {
    const body = document.body.textContent ?? '';

    assert.match(body, /Insulinpräparat/);
    assert.match(body, /Insulindosis/);
    assert.match(body, /Verabreichungskontext/);
    assert.doesNotMatch(body, /[\u0400-\u04ff]/);
  } finally {
    await view.cleanup();
  }
});
