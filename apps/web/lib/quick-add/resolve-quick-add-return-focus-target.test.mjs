import assert from 'node:assert/strict';
import { after } from 'node:test';
import test from 'node:test';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../platform/integration/tests/integration-dom-setup.mjs';
import {
  focusQuickAddReturnTarget,
  resolveQuickAddReturnFocusTarget,
} from './resolve-quick-add-return-focus-target.ts';

after(() => {
  teardownIntegrationDom();
});

function createButton(label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  document.body.appendChild(button);
  return button;
}

test.before(() => {
  setupIntegrationDom();
});

test('returns the opener when it is still connected', () => {
  const opener = createButton('Glucose');

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      openedFromEmptyGlucoseCta: false,
      opener,
      readyLastGlucoseFocusTarget: null,
      reason: 'dismiss',
    }),
    opener,
  );

  opener.remove();
});

test('returns empty-glucose success fallback when opener is detached', () => {
  const opener = createButton('Add glucose');
  const readyTarget = createButton('Last glucose');
  opener.remove();

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      openedFromEmptyGlucoseCta: true,
      opener,
      readyLastGlucoseFocusTarget: readyTarget,
      reason: 'success',
    }),
    readyTarget,
  );

  readyTarget.remove();
});

test('does not return ready fallback for empty-glucose dismiss', () => {
  const opener = createButton('Add glucose');
  const readyTarget = createButton('Last glucose');
  opener.remove();

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      openedFromEmptyGlucoseCta: true,
      opener,
      readyLastGlucoseFocusTarget: readyTarget,
      reason: 'dismiss',
    }),
    null,
  );

  readyTarget.remove();
});

test('does not return ready fallback for quick-action success', () => {
  const opener = createButton('Insulin');
  const readyTarget = createButton('Last glucose');
  opener.remove();

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      openedFromEmptyGlucoseCta: false,
      opener,
      readyLastGlucoseFocusTarget: readyTarget,
      reason: 'success',
    }),
    null,
  );

  readyTarget.remove();
});

test('focusQuickAddReturnTarget rejects disconnected targets', () => {
  const opener = createButton('Glucose');
  opener.remove();

  assert.equal(focusQuickAddReturnTarget(opener), false);
});
