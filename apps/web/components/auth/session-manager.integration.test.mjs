import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { SessionManager } from './session-manager.tsx';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const sessionManagerSource = readFileSync(
  join(currentDirectory, 'session-manager.tsx'),
  'utf8',
);

/** @type {import('@diabetes-universe/identity').AccountSessionSummary} */
const currentSession = {
  sessionId: 'session-current-hidden',
  isCurrentSession: true,
  createdAt: '2026-08-12T10:00:00.000Z',
  expiresAt: '2026-08-19T10:00:00.000Z',
  clientLabel: 'Chrome · macOS',
  clientKind: 'browser',
};

/** @type {import('@diabetes-universe/identity').AccountSessionSummary} */
const otherSession = {
  sessionId: 'session-other-hidden',
  isCurrentSession: false,
  createdAt: '2026-08-11T10:00:00.000Z',
  expiresAt: '2026-08-18T10:00:00.000Z',
  clientLabel: 'Safari · iPhone',
  clientKind: 'mobile',
};

after(() => {
  teardownIntegrationDom();
});

test('session manager renders localized English copy and current badge', async () => {
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
        createElement(SessionManager, {
          passkeyManagementEnabled: true,
          sessions: [currentSession, otherSession],
        }),
      ),
    );
  });

  try {
    const text = document.body.textContent ?? '';

    assert.match(text, /Current session/);
    assert.match(text, /Chrome · macOS/);
    assert.match(text, /Safari · iPhone/);
    assert.match(text, /Sign out other sessions/);
    assert.match(text, /Sign out everywhere/);
    assert.doesNotMatch(text, /session-current-hidden/);
    assert.doesNotMatch(text, /session-other-hidden/);
    assert.equal(
      document.querySelector('input[name="sessionId"][type="hidden"]') !== null,
      true,
    );
    assert.equal(
      document.querySelector('form[action] button') !== null ||
        document.querySelector('button') !== null,
      true,
    );
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('session manager hides revoke others action when no other sessions exist', async () => {
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
        createElement(SessionManager, {
          passkeyManagementEnabled: false,
          sessions: [currentSession],
        }),
      ),
    );
  });

  try {
    const text = document.body.textContent ?? '';

    assert.match(text, /No other active sessions were found./);
    assert.equal(text.includes('Sign out other sessions'), false);
    assert.match(text, /Sign out everywhere/);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});

test('session manager source uses current sign-out action and revoke-by-id for others', () => {
  assert.match(sessionManagerSource, /signOutCurrentSessionAction/);
  assert.match(sessionManagerSource, /revokeAccountSessionAction/);
  assert.doesNotMatch(sessionManagerSource, /toLocaleString\(/);
  assert.doesNotMatch(sessionManagerSource, /Intl\.DateTimeFormat/);
  assert.doesNotMatch(sessionManagerSource, /userAgent/);
  assert.doesNotMatch(sessionManagerSource, /ipAddress/);
  assert.doesNotMatch(sessionManagerSource, /result\.sessions/);
});

test('session manager source includes accessible confirmation dialog semantics', () => {
  const dialogSource = readFileSync(
    join(currentDirectory, 'session-confirm-dialog.tsx'),
    'utf8',
  );

  assert.match(sessionManagerSource, /SessionConfirmDialog/);
  assert.match(dialogSource, /role="dialog"/);
  assert.match(dialogSource, /aria-modal="true"/);
});
