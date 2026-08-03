import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { resolveDashboardRecentEventsLabels } from './dashboard-recent-events-labels.ts';

test('resolveDashboardRecentEventsLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardRecentEventsLabels(runtime.localization);

  assert.equal(labels.title, 'Recent events');
  assert.equal(labels.viewAll, 'All events');
  assert.equal(labels.loading, 'Loading recent events');
  assert.equal(labels.unavailable, 'Recent events unavailable.');
  assert.equal(labels.defaultEmpty, 'No recent events yet.');
  assert.equal(labels.defaultError, 'Could not load recent events.');
  assert.equal(labels.categories.activity, 'Activity');
  assert.equal(labels.categories.insulin, 'Insulin');
  assert.equal(labels.categories.medication, 'Medication');
  assert.equal(labels.categories.nutrition, 'Nutrition');
});

test('resolveDashboardRecentEventsLabels uses preloaded dashboard namespace', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() =>
    resolveDashboardRecentEventsLabels(runtime.localization),
  );
  assert.equal(
    runtime.localization.hasTranslation('dashboard.recentEvents.title'),
    true,
  );
});

test('resolveDashboardRecentEventsLabels returns a fresh immutable snapshot', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const first = resolveDashboardRecentEventsLabels(runtime.localization);
  const second = resolveDashboardRecentEventsLabels(runtime.localization);

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});
