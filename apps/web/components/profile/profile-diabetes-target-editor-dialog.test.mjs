import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after, beforeEach } from 'node:test';
import { act } from 'react';
import { createElement, useState } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { ProfileDiabetesTargetEditorDialog } from './profile-diabetes-target-editor-dialog.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const dialogSource = readFileSync(
  join(currentDirectory, 'profile-diabetes-target-editor-dialog.tsx'),
  'utf8',
);

const labels = {
  diabetesType: {},
  disclaimer: '',
  errors: {},
  glucose: {},
  loading: '',
  page: {},
  saved: 'Saved',
  saving: 'Saving',
  target: {
    editAction: 'Edit',
    notSet: 'Not set',
    remove: 'Remove target range',
    removeConfirm: {
      cancel: 'Cancel',
      confirm: 'Remove range',
      description: 'Description',
      title: 'Remove target range?',
    },
    dialog: {
      cancel: 'Cancel',
      lowerLabel: 'Lower limit',
      save: 'Save',
      title: 'Target range',
      upperLabel: 'Upper limit',
    },
    title: 'Target range',
    validation: {
      invalidNumber: 'Enter valid numbers for the selected units.',
      lowerAboveUpper: 'The lower limit must be less than the upper limit.',
      outOfRange: 'Values are outside the supported range.',
    },
  },
};

function TargetEditorHarness({
  displayUnit = 'mmol_per_l',
  initialHighValue = '',
  initialLowValue = '',
  initialOpen = true,
}) {
  const [lowValue, setLowValue] = useState(initialLowValue);
  const [highValue, setHighValue] = useState(initialHighValue);
  const [validationMessage, setValidationMessage] = useState(null);
  const [open, setOpen] = useState(initialOpen);

  return createElement(
    'div',
    null,
    createElement(
      'button',
      { id: 'target-range-trigger', type: 'button' },
      'Target range',
    ),
    createElement(ProfileDiabetesTargetEditorDialog, {
      displayUnit,
      highValue,
      isPending: false,
      labels,
      lowValue,
      onCancel: () => {
        setOpen(false);
        setValidationMessage(null);
      },
      onHighValueChange: setHighValue,
      onLowValueChange: setLowValue,
      onSave: () => {
        setValidationMessage(
          'The lower limit must be less than the upper limit.',
        );
      },
      open,
      validationMessage,
    }),
  );
}

async function setInputValue(input, value) {
  await act(async () => {
    input.focus();
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    );
    descriptor.set.call(input, value);
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

async function mountHarness(props = {}) {
  setupIntegrationDom();

  if (typeof globalThis.requestAnimationFrame !== 'function') {
    globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
    globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(createElement(TargetEditorHarness, props));
  });

  return {
    async rerender(nextProps = {}) {
      await act(async () => {
        root.render(createElement(TargetEditorHarness, nextProps));
      });
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
    getLowerInput() {
      return document.querySelector('input');
    },
    getUpperInput() {
      return document.querySelectorAll('input')[1] ?? null;
    },
    getTrigger() {
      return document.getElementById('target-range-trigger');
    },
  };
}

beforeEach(() => {
  setupIntegrationDom();
});

after(() => {
  teardownIntegrationDom();
});

test('target editor focuses lower input on initial open', async () => {
  const harness = await mountHarness();

  try {
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    assert.equal(document.activeElement, harness.getLowerInput());
  } finally {
    await harness.unmount();
  }
});

test('target editor keeps lower input focused while controlled value updates rerender parent', async () => {
  const harness = await mountHarness();

  try {
    const lowerInput = harness.getLowerInput();
    assert.ok(lowerInput);
    lowerInput.focus();

    for (const nextValue of ['4', '4.', '4.5']) {
      await setInputValue(lowerInput, nextValue);
      assert.equal(
        document.activeElement,
        lowerInput,
        `focus remained on lower input after ${nextValue}`,
      );
    }
  } finally {
    await harness.unmount();
  }
});

test('target editor keeps upper input focused across validation rerenders', async () => {
  const harness = await mountHarness({ initialLowValue: '4.0' });

  try {
    const upperInput = harness.getUpperInput();
    assert.ok(upperInput);
    upperInput.focus();

    await act(async () => {
      document
        .querySelector('[role="dialog"] button:last-of-type')
        ?.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    });

    assert.equal(document.activeElement, upperInput);
    assert.ok(document.querySelector('[role="alert"]'));
  } finally {
    await harness.unmount();
  }
});

test('target editor restores focus to trigger when dialog closes', async () => {
  const harness = await mountHarness({ initialOpen: false });

  try {
    const trigger = harness.getTrigger();
    assert.ok(trigger);
    trigger.focus();

    await harness.rerender({ initialOpen: true });
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    await act(async () => {
      const cancelButton = Array.from(
        document.querySelectorAll('[role="dialog"] button'),
      ).find((button) => button.textContent === 'Cancel');
      cancelButton?.dispatchEvent(
        new window.MouseEvent('click', { bubbles: true }),
      );
    });

    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });

    assert.equal(document.activeElement, trigger);
  } finally {
    await harness.unmount();
  }
});

test('target editor focus hook stores onClose in a ref instead of effect dependency', () => {
  assert.match(
    dialogSource,
    /useLayoutEffect\(\(\) => \{\s*onCloseRef\.current = onClose;/,
  );
  assert.doesNotMatch(
    dialogSource,
    /\[dialogRef, onClose, open, restoreFocusRef\]/,
  );
  assert.match(dialogSource, /initialFocusRef/);
});
