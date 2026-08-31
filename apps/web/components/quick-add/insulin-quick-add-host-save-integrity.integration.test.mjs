import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import { QuickAddHost } from './quick-add-host.tsx';
import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { TestPlatformProvider } from '../../lib/platform/react/testing/test-platform-provider.ts';
import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../lib/platform/integration/tests/integration-dom-setup.mjs';
import { dispatchEscapeKey } from './testing/glucose-quick-add-integration-helpers.mjs';

const hostSource = readFileSync(
  join(dirname(new URL(import.meta.url).pathname), 'quick-add-host.tsx'),
  'utf8',
);

after(() => {
  teardownIntegrationDom();
});

test('QuickAddHost wires async submit pending to dismissDisabled', () => {
  assert.match(hostSource, /asyncSubmitPendingRef/);
  assert.match(hostSource, /isAsyncSubmitPending/);
  assert.match(hostSource, /dismissDisabled=\{isAsyncSubmitPending\}/);
  assert.match(
    hostSource,
    /onSubmittingChange=\{handleAsyncSubmittingChange\}/,
  );
  assert.match(hostSource, /canDismissQuickAddWhileSubmitPending/);
});

test('QuickAddHost guards close and cancel while async submit is pending', () => {
  assert.match(hostSource, /if \(\s*!canDismissQuickAddWhileSubmitPending/);
});

test('QuickAddHost releases async pending lock before success close for insulin', () => {
  assert.match(hostSource, /releaseAsyncSubmitPending\(\)/);
  assert.match(
    hostSource,
    /const handleInsulinSubmit = async[\s\S]*releaseAsyncSubmitPending\(\);[\s\S]*haptics\.success\(\);[\s\S]*closeQuickAdd\('success'\)/,
  );
});

test('note quick add host dismiss is unaffected without async submit pending lock', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  setupIntegrationDom();
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let openChangeCount = 0;

  await act(async () => {
    root.render(
      createElement(
        TestPlatformProvider,
        { runtime },
        createElement(QuickAddHost, {
          onNoteSubmit: () => {},
          onOpenChange: () => {
            openChangeCount += 1;
          },
          open: true,
          openCategory: 'note',
        }),
      ),
    );
  });

  try {
    await dispatchEscapeKey();
    assert.equal(openChangeCount, 1);
  } finally {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    teardownIntegrationDom();
  }
});
