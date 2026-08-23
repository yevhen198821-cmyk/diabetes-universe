import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { resolveDashboardHeaderLabels } from './dashboard-header-labels.ts';

test('resolveDashboardHeaderLabels returns canonical English dashboard header strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardHeaderLabels(runtime.localization);

  assert.equal(labels.productName, 'Home');
  assert.equal(labels.brandName, 'Diabetes Universe');
  assert.equal(labels.addEvent, 'Add event');
  assert.equal(labels.avatar, 'User profile');
  assert.equal(labels.avatarAction, 'Open account');
  assert.equal(labels.currentDate, 'Current date');
  assert.equal(labels.dateUnavailable, 'Date unavailable');
  assert.equal(labels.loading, 'Loading header');
  assert.equal(labels.defaultError, 'Could not load header data.');
});

test('resolveDashboardHeaderLabels uses preloaded dashboard namespace without runtime construction', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() => resolveDashboardHeaderLabels(runtime.localization));
  assert.equal(
    runtime.localization.hasTranslation('dashboard.header.title'),
    true,
  );
});
