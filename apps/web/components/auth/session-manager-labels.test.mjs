import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  formatRevokeOneConfirmationDescription,
  resolveSessionManagerLabels,
} from './session-manager-labels.ts';

test('resolveSessionManagerLabels returns canonical English session strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveSessionManagerLabels(runtime.localization);

  assert.equal(labels.title, 'Active sessions');
  assert.equal(labels.currentBadge, 'Current session');
  assert.equal(labels.revokeOne, 'End session');
  assert.equal(labels.revokeOthers, 'Sign out other sessions');
  assert.equal(labels.revokeAll, 'Sign out everywhere');
  assert.equal(
    labels.freshAuthMessage,
    'Confirm sign-in and try the action again.',
  );
  assert.equal(labels.freshAuthAction, 'Confirm sign-in');
});

test('formatRevokeOneConfirmationDescription interpolates clientLabel only', () => {
  const description = formatRevokeOneConfirmationDescription(
    'Access from {clientLabel} will be revoked.',
    'Chrome · macOS',
  );

  assert.equal(description, 'Access from Chrome · macOS will be revoked.');
});
