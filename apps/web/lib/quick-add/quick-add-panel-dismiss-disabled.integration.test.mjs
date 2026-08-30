import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { QuickAddPanel } from '@diabetes-universe/ui';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';

after(() => {
  teardownIntegrationDom();
});

const actions = [
  {
    addTitle: 'Добавить глюкозу',
    category: 'glucose',
    description: 'desc',
    icon: null,
    id: 'glucose',
    label: 'Глюкоза',
  },
];

async function renderDismissDisabledPanel({ dismissDisabled = false } = {}) {
  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let closeCount = 0;
  let backCount = 0;

  await act(async () => {
    root.render(
      createElement(QuickAddPanel, {
        actions,
        dismissDisabled,
        onBack: () => {
          backCount += 1;
        },
        onClose: () => {
          closeCount += 1;
        },
        onSelectAction: () => {},
        open: true,
        selectedActionId: 'glucose',
        selectedContent: createElement('p', null, 'form-body'),
      }),
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
    getBackButton() {
      return [...document.querySelectorAll('button')].find(
        (button) => button.getAttribute('aria-label') === 'Назад к выбору типа',
      );
    },
    getBackdropButton() {
      return [...document.querySelectorAll('button')].find(
        (button) =>
          button.getAttribute('aria-label') === 'Закрыть быстрое добавление',
      );
    },
    getCloseCounts() {
      return { backCount, closeCount };
    },
    async pressEscape() {
      await act(async () => {
        document.dispatchEvent(
          new window.KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }),
        );
      });
    },
  };
}

test('QuickAddPanel dismissDisabled blocks Escape and backdrop', async () => {
  const view = await renderDismissDisabledPanel({ dismissDisabled: true });

  try {
    await view.pressEscape();
    await act(async () => {
      view.getBackdropButton()?.click();
    });

    assert.deepEqual(view.getCloseCounts(), { backCount: 0, closeCount: 0 });
    assert.equal(view.getBackdropButton()?.disabled, true);
  } finally {
    await view.cleanup();
  }
});

test('QuickAddPanel dismissDisabled blocks header Back', async () => {
  const view = await renderDismissDisabledPanel({ dismissDisabled: true });

  try {
    await act(async () => {
      view.getBackButton()?.click();
    });

    assert.deepEqual(view.getCloseCounts(), { backCount: 0, closeCount: 0 });
    assert.equal(view.getBackButton()?.disabled, true);
  } finally {
    await view.cleanup();
  }
});

test('QuickAddPanel allows dismiss when dismissDisabled is false', async () => {
  const view = await renderDismissDisabledPanel({ dismissDisabled: false });

  try {
    await view.pressEscape();
    assert.equal(view.getCloseCounts().closeCount, 1);
  } finally {
    await view.cleanup();
  }
});
