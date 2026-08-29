import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  resolveDashboardLastGlucoseLabels,
  resolveDashboardLastGlucoseTimeLabels,
} from './dashboard-last-glucose-labels.ts';

test('resolveDashboardLastGlucoseLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardLastGlucoseLabels(runtime.localization);

  assert.equal(labels.title, 'Last glucose');
  assert.equal(labels.eyebrow, 'Last measurement');
  assert.equal(labels.loading, 'Loading last glucose measurement');
  assert.equal(labels.stale, 'Measurement is outdated.');
  assert.equal(labels.unavailable, 'Last measurement unavailable.');
  assert.equal(labels.defaultEmpty, 'No measurements yet.');
  assert.equal(labels.defaultError, 'Could not load the last measurement.');
  assert.equal(labels.emptyCta, 'Add glucose');
});

test('resolveDashboardLastGlucoseTimeLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardLastGlucoseTimeLabels(runtime.localization);

  assert.equal(labels.justNow, 'Just now');
  assert.equal(labels.today, 'Today');
  assert.equal(labels.yesterday, 'Yesterday');
});

test('resolveDashboardLastGlucoseLabels uses preloaded dashboard namespace', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() =>
    resolveDashboardLastGlucoseLabels(runtime.localization),
  );
  assert.equal(
    runtime.localization.hasTranslation('dashboard.lastGlucose.title'),
    true,
  );
});

test('resolveDashboardLastGlucoseLabels returns a fresh immutable snapshot', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const first = resolveDashboardLastGlucoseLabels(runtime.localization);
  const second = resolveDashboardLastGlucoseLabels(runtime.localization);

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});
