import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import { resolveDashboardAiInsightLabels } from './dashboard-ai-insight-labels.ts';

test('resolveDashboardAiInsightLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardAiInsightLabels(runtime.localization);

  assert.equal(labels.title, 'AI insight');
  assert.equal(labels.eyebrow, 'Automatic explanation');
  assert.equal(labels.disclaimer, 'Not a diagnosis or treatment prescription.');
  assert.equal(labels.loading, 'Loading AI insight');
  assert.equal(labels.unavailable, 'AI insight unavailable.');
  assert.equal(labels.defaultEmpty, 'AI insight is not available yet.');
  assert.equal(labels.defaultError, 'Could not load AI insight.');
  assert.equal(labels.relatedEventsLabel, 'Related records');
  assert.equal(
    labels.relatedEventsNone,
    'Related records: no confirmed records',
  );
});

test('resolveDashboardAiInsightLabels uses preloaded dashboard namespace', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() =>
    resolveDashboardAiInsightLabels(runtime.localization),
  );
  assert.equal(
    runtime.localization.hasTranslation('dashboard.aiInsight.title'),
    true,
  );
});

test('resolveDashboardAiInsightLabels returns a fresh immutable snapshot', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const first = resolveDashboardAiInsightLabels(runtime.localization);
  const second = resolveDashboardAiInsightLabels(runtime.localization);

  assert.notEqual(first, second);
  assert.deepEqual(first, second);
});
