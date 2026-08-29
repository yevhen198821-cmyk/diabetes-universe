import assert from 'node:assert/strict';
import { after } from 'node:test';
import test from 'node:test';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../platform/integration/tests/integration-dom-setup.mjs';
import { resolveQuickAddReturnFocusTarget } from './resolve-quick-add-return-focus-target.ts';

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
      fallback: null,
      opener,
    }),
    opener,
  );

  opener.remove();
});

test('returns the fallback when the opener is detached', () => {
  const opener = createButton('Add glucose');
  const fallback = createButton('Last glucose');
  opener.remove();

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      fallback,
      opener,
    }),
    fallback,
  );

  fallback.remove();
});

test('returns null when neither opener nor fallback are connected', () => {
  const opener = createButton('Add glucose');
  const fallback = createButton('Last glucose');
  opener.remove();
  fallback.remove();

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      fallback,
      opener,
    }),
    null,
  );
});

test('prefers the opener when both opener and fallback are connected', () => {
  const opener = createButton('Insulin');
  const fallback = createButton('Last glucose');

  assert.equal(
    resolveQuickAddReturnFocusTarget({
      fallback,
      opener,
    }),
    opener,
  );

  opener.remove();
  fallback.remove();
});
