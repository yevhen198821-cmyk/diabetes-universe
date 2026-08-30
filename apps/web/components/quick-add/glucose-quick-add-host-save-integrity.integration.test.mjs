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
import { TestDiabetesSettingsProvider } from '../../lib/medical/react/testing/test-diabetes-settings-provider.tsx';
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

test('QuickAddHost wires glucose submit pending to dismissDisabled', () => {
  assert.match(hostSource, /glucoseSubmitPendingRef/);
  assert.match(hostSource, /isGlucoseSubmitPending/);
  assert.match(hostSource, /dismissDisabled=\{isGlucoseSubmitPending\}/);
  assert.match(
    hostSource,
    /onSubmittingChange=\{handleGlucoseSubmittingChange\}/,
  );
  assert.match(hostSource, /canDismissQuickAddWhileGlucoseSubmitPending/);
});

test('QuickAddHost guards close and cancel while glucose submit is pending', () => {
  assert.match(
    hostSource,
    /if \(\s*!canDismissQuickAddWhileGlucoseSubmitPending/,
  );
});

test('QuickAddHost releases glucose pending lock before success close', () => {
  assert.match(hostSource, /releaseGlucoseSubmitPending\(\)/);
  assert.match(
    hostSource,
    /releaseGlucoseSubmitPending\(\);\s*\n\s*haptics\.success\(\);\s*\n\s*closeQuickAdd\('success'\)/,
  );
});

test('note quick add host dismiss is unaffected without glucose pending lock', async () => {
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
        createElement(
          TestDiabetesSettingsProvider,
          { glucoseDisplayUnit: 'mmol_per_l' },
          createElement(QuickAddHost, {
            onNoteSubmit: () => {},
            onOpenChange: () => {
              openChangeCount += 1;
            },
            open: true,
            openCategory: 'note',
          }),
        ),
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
