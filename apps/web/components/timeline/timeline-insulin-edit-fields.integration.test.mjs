import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createInsulinEditSelection } from '../../lib/medical/insulin/resolve-insulin-edit-transition.ts';
import { resolveInsulinPresentationLabels } from '../../lib/medical/insulin/insulin-presentation-labels.ts';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { resolveTimelineUiLabels } from './timeline-ui-labels.ts';
import { TimelineInsulinEditFields } from './timeline-insulin-edit-fields.tsx';

after(() => {
  teardownIntegrationDom();
});

const semanticInsulin = {
  administrationContext: 'before_meal',
  doseUnits: 4,
  preparation: 'NovoRapid',
  preparationId: 'insulin.prep.aspart_novorapid',
};

const legacyInsulin = {
  context: 'Перед завтраком',
  doseUnits: 4,
  preparation: 'NovoRapid',
};

const noContextInsulin = {
  doseUnits: 12,
  preparation: 'Lantus',
};

async function renderInsulinFields({
  errors = {},
  event,
  request,
  selectionOverrides = {},
} = {}) {
  setupIntegrationDom();

  const runtime = await createTestPlatformRuntime(
    request ? { request } : undefined,
  );
  const presentationLabels = resolveInsulinPresentationLabels(
    runtime.localization,
  );
  const labels = resolveTimelineUiLabels(runtime.localization).detail.form
    .insulin;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const changes = [];
  let selection = {
    ...createInsulinEditSelection(event),
    ...selectionOverrides,
  };

  const renderWithSelection = async () => {
    await act(async () => {
      root.render(
        createElement(TimelineInsulinEditFields, {
          errors,
          labels,
          legacyContextText: event === legacyInsulin ? 'Перед завтраком' : null,
          onChange: (next) => {
            changes.push(next);
            selection = next;
            void renderWithSelection();
          },
          presentationLabels,
          selection,
          storedPreparation: event.preparation,
          storedPreparationIsUnmatched: event.preparationId === undefined,
        }),
      );
    });
  };

  await renderWithSelection();

  const field = (id) => document.getElementById(id);
  const labelFor = (id) =>
    [...document.querySelectorAll('label')].find(
      (candidate) => candidate.getAttribute('for') === id,
    );

  return {
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
    changes,
    field,
    labelFor,
    labels,
    presentationLabels,
    async selectValue(id, value) {
      const element = field(id);

      await act(async () => {
        element.value = value;
        element.dispatchEvent(new window.Event('change', { bubbles: true }));
      });
    },
    async typeValue(id, value) {
      const element = field(id);

      await act(async () => {
        element.value = value;
        element.dispatchEvent(new window.Event('input', { bubbles: true }));
      });
    },
  };
}

test('insulin edit controls are labelled, native, and keyboard reachable', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    for (const id of [
      'timeline-edit-insulin-prep',
      'timeline-edit-insulin-dose',
      'timeline-edit-insulin-context',
    ]) {
      const control = view.field(id);

      assert.ok(control, `${id} is rendered`);
      assert.equal(control.hasAttribute('disabled'), false);
      assert.ok(view.labelFor(id), `${id} has an associated label`);
      assert.equal(control.getAttribute('tabindex'), null);
    }

    assert.equal(view.field('timeline-edit-insulin-prep').tagName, 'SELECT');
    assert.equal(view.field('timeline-edit-insulin-context').tagName, 'SELECT');
  } finally {
    await view.cleanup();
  }
});

test('insulin edit controls keep the 44px mobile touch target height', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    for (const id of [
      'timeline-edit-insulin-prep',
      'timeline-edit-insulin-dose',
      'timeline-edit-insulin-context',
    ]) {
      assert.match(view.field(id).className, /\bh-11\b/);
    }
  } finally {
    await view.cleanup();
  }
});

test('the preparation picker groups catalogue entries under localized chrome', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    const groups = [
      ...view.field('timeline-edit-insulin-prep').querySelectorAll('optgroup'),
    ].map((group) => group.getAttribute('label'));

    assert.deepEqual(groups, [
      'Rapid-acting insulin',
      'Long-acting insulin',
      'Other insulin',
    ]);

    const values = [
      ...view.field('timeline-edit-insulin-prep').querySelectorAll('option'),
    ].map((option) => option.value);

    assert.deepEqual(values, [
      'insulin.prep.aspart_novorapid',
      'insulin.prep.aspart_fiasp',
      'insulin.prep.lispro_humalog',
      'insulin.prep.glulisine_apidra',
      'insulin.prep.glargine_lantus',
      'insulin.prep.degludec_tresiba',
      'insulin.prep.other',
    ]);
  } finally {
    await view.cleanup();
  }
});

test('a semantic event offers no option that clears its catalogue identity', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    const values = [
      ...view.field('timeline-edit-insulin-prep').querySelectorAll('option'),
    ].map((option) => option.value);

    assert.equal(values.includes(''), false);
  } finally {
    await view.cleanup();
  }
});

test('selecting another preparation reports the new identity without a title string', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    await view.selectValue(
      'timeline-edit-insulin-prep',
      'insulin.prep.glargine_lantus',
    );

    const [change] = view.changes;

    assert.equal(change.preparationId, 'insulin.prep.glargine_lantus');
    assert.equal('preparation' in change, false);
  } finally {
    await view.cleanup();
  }
});

test('choosing Other reveals a required name field', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    assert.equal(view.field('timeline-edit-insulin-other-name'), null);

    await view.selectValue('timeline-edit-insulin-prep', 'insulin.prep.other');

    const otherName = view.field('timeline-edit-insulin-other-name');

    assert.ok(otherName);
    assert.equal(otherName.value, '');
    assert.ok(view.labelFor('timeline-edit-insulin-other-name'));
  } finally {
    await view.cleanup();
  }
});

test('a blank Other name error is announced accessibly', async () => {
  const view = await renderInsulinFields({
    errors: { otherName: 'Enter the preparation name.' },
    event: semanticInsulin,
    selectionOverrides: { preparationId: 'insulin.prep.other' },
  });

  try {
    const otherName = view.field('timeline-edit-insulin-other-name');
    const error = view.field('timeline-edit-insulin-other-name-error');

    assert.equal(otherName.getAttribute('aria-invalid'), 'true');
    assert.equal(
      otherName.getAttribute('aria-describedby'),
      'timeline-edit-insulin-other-name-error',
    );
    assert.equal(error.getAttribute('role'), 'alert');
    assert.equal(error.textContent, 'Enter the preparation name.');
  } finally {
    await view.cleanup();
  }
});

test('a dose error is announced accessibly without clinical wording', async () => {
  const view = await renderInsulinFields({
    errors: { dose: 'Enter a dose greater than 0 and no more than 100.' },
    event: semanticInsulin,
  });

  try {
    const dose = view.field('timeline-edit-insulin-dose');
    const error = view.field('timeline-edit-insulin-dose-error');

    assert.equal(dose.getAttribute('aria-invalid'), 'true');
    assert.equal(
      dose.getAttribute('aria-describedby'),
      'timeline-edit-insulin-dose-error',
    );
    assert.equal(error.getAttribute('role'), 'alert');
    assert.equal(/safe|recommend/i.test(error.textContent), false);
  } finally {
    await view.cleanup();
  }
});

test('the dose field uses a decimal keypad hint on mobile', async () => {
  const view = await renderInsulinFields({ event: semanticInsulin });

  try {
    assert.equal(
      view.field('timeline-edit-insulin-dose').getAttribute('inputmode'),
      'decimal',
    );
  } finally {
    await view.cleanup();
  }
});

test('a legacy event keeps its recorded name and text as selectable defaults', async () => {
  const view = await renderInsulinFields({ event: legacyInsulin });

  try {
    const preparationOptions = [
      ...view.field('timeline-edit-insulin-prep').querySelectorAll('option'),
    ];
    const contextOptions = [
      ...view.field('timeline-edit-insulin-context').querySelectorAll('option'),
    ];

    assert.equal(preparationOptions[0].value, '');
    assert.equal(
      preparationOptions[0].textContent,
      'Keep recorded name: NovoRapid',
    );
    assert.equal(view.field('timeline-edit-insulin-prep').value, '');

    assert.equal(contextOptions[0].value, '');
    assert.equal(
      contextOptions[0].textContent,
      'Keep recorded text: Перед завтраком',
    );
    assert.equal(view.field('timeline-edit-insulin-context').value, '');
  } finally {
    await view.cleanup();
  }
});

test('an explicit context choice marks the selection as edited', async () => {
  const view = await renderInsulinFields({ event: legacyInsulin });

  try {
    await view.selectValue('timeline-edit-insulin-context', 'correction');

    const [change] = view.changes;

    assert.equal(change.administrationContext, 'correction');
    assert.equal(change.contextEdited, true);
  } finally {
    await view.cleanup();
  }
});

test('a no-context event shows absence separately from the explicit unspecified option', async () => {
  const view = await renderInsulinFields({ event: noContextInsulin });

  try {
    const context = view.field('timeline-edit-insulin-context');
    const options = [...context.querySelectorAll('option')].map((option) => ({
      label: option.textContent,
      value: option.value,
    }));

    assert.equal(context.value, '');
    assert.equal(options[0].value, '');
    assert.equal(options[0].label, 'No context recorded');
    assert.equal(
      options.some(
        (option) =>
          option.value === 'unspecified' && option.label === 'Not specified',
      ),
      true,
    );
  } finally {
    await view.cleanup();
  }
});

test('selecting unspecified on a no-context event marks the selection as edited', async () => {
  const view = await renderInsulinFields({ event: noContextInsulin });

  try {
    await view.selectValue('timeline-edit-insulin-context', 'unspecified');

    const [change] = view.changes;

    assert.equal(change.administrationContext, 'unspecified');
    assert.equal(change.contextEdited, true);
  } finally {
    await view.cleanup();
  }
});

test('Russian chrome renders without mixed-language insulin labels', async () => {
  const view = await renderInsulinFields({
    event: legacyInsulin,
    request: { acceptLanguage: 'ru-RU', cookieTimeZone: 'Europe/Moscow' },
  });

  try {
    const groups = [
      ...view.field('timeline-edit-insulin-prep').querySelectorAll('optgroup'),
    ].map((group) => group.getAttribute('label'));
    const contextLabels = [
      ...view.field('timeline-edit-insulin-context').querySelectorAll('option'),
    ]
      .slice(1)
      .map((option) => option.textContent);

    assert.deepEqual(groups, [
      'Инсулин быстрого действия',
      'Инсулин длительного действия',
      'Другой инсулин',
    ]);
    assert.deepEqual(contextLabels, [
      'Перед едой',
      'После еды',
      'Коррекция',
      'Базальный',
      'Другое',
      'Не указан',
    ]);
    assert.equal(
      view.labelFor('timeline-edit-insulin-prep').textContent,
      'Препарат инсулина',
    );
    assert.equal(
      view.labelFor('timeline-edit-insulin-dose').textContent,
      'Доза инсулина',
    );
  } finally {
    await view.cleanup();
  }
});
