import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { resolveDashboardDaySummaryLabels } from './dashboard-day-summary-labels.ts';

test('resolveDashboardDaySummaryLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardDaySummaryLabels(runtime.localization);

  assert.equal(labels.title, 'Today');
  assert.equal(labels.eyebrow, 'Current day');
  assert.equal(labels.loading, 'Loading day summary');
  assert.equal(labels.unavailable, 'Day summary unavailable.');
  assert.equal(labels.defaultEmpty, "Today's summary is not available yet.");
  assert.equal(labels.defaultError, 'Could not load the day summary.');
  assert.equal(labels.glucose, 'Glucose');
  assert.equal(labels.totalInsulin, 'Insulin');
  assert.equal(labels.totalCarbohydrates, 'Carbohydrates');
  assert.equal(labels.activity, 'Activity');
  assert.equal(labels.totalForDay, 'Total for the day');
  assert.equal(labels.viewDetails, 'Details');
  assert.equal(labels.chartEmptyHint, 'No entries today');
  assert.equal(labels.units.compactMassG, 'g');
  assert.equal(labels.units.compactInsulinDose, 'U');
});

test('resolveDashboardDaySummaryLabels uses preloaded dashboard namespace', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() =>
    resolveDashboardDaySummaryLabels(runtime.localization),
  );
  assert.equal(
    runtime.localization.hasTranslation('dashboard.daySummary.title'),
    true,
  );
});

test('resolveDashboardDaySummaryLabels returns a fresh immutable snapshot', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const first = resolveDashboardDaySummaryLabels(runtime.localization);
  const second = resolveDashboardDaySummaryLabels(runtime.localization);

  assert.notEqual(first, second);
  assert.equal(first.title, second.title);
  assert.equal(first.chartAria.glucose(2), second.chartAria.glucose(2));
  assert.equal(first.chartAria.insulin(0), second.chartAria.insulin(0));
});
