import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { SessionStatusMessage } from './session-confirm-dialog.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const sessionManagerSource = readFileSync(
  join(currentDirectory, 'session-manager.tsx'),
  'utf8',
);

after(() => {
  teardownIntegrationDom();
});

test('SessionStatusMessage uses role=status for success feedback', async () => {
  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        SessionStatusMessage,
        { tone: 'success' },
        'Action completed.',
      ),
    );
  });

  try {
    const message = document.querySelector('[role="status"]');

    assert.equal(message?.textContent, 'Action completed.');
    assert.equal(document.querySelector('[role="alert"]'), null);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('SessionStatusMessage uses role=alert for error feedback', async () => {
  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(
        SessionStatusMessage,
        { tone: 'error' },
        'Could not complete the action.',
      ),
    );
  });

  try {
    const message = document.querySelector('[role="alert"]');

    assert.equal(message?.textContent, 'Could not complete the action.');
    assert.equal(document.querySelector('[role="status"]'), null);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('fresh-auth feedback uses role=alert', () => {
  assert.match(sessionManagerSource, /function FreshAuthAlert/);
  assert.match(sessionManagerSource, /role="alert"/);
});
