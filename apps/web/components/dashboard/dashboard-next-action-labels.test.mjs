import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  resolveDashboardNextActionDemoStep,
  resolveDashboardNextActionEmptyContent,
  resolveDashboardNextActionErrorContent,
  resolveDashboardNextActionLabels,
} from './dashboard-next-action-labels.ts';

const demoSource = {
  priority: 'high',
  type: 'insulin',
};

test('resolveDashboardNextActionLabels returns canonical English strings', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const labels = resolveDashboardNextActionLabels(runtime.localization);

  assert.equal(labels.loading, 'Loading next action');
  assert.equal(labels.emptyTitle, 'No actions available');
  assert.equal(labels.emptyDescription, 'New actions will appear here.');
  assert.equal(labels.errorTitle, 'Action unavailable');
  assert.equal(labels.errorDescription, 'Please try again later.');
});

test('resolveDashboardNextActionDemoStep maps structural insulin source to NextStep', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const step = resolveDashboardNextActionDemoStep(
    runtime.localization,
    demoSource,
  );

  assert.equal(step.title, 'Next action');
  assert.equal(step.description, 'Add insulin');
  assert.equal(step.actionLabel, 'Add');
});

test('resolveDashboardNextActionLabels uses preloaded dashboard namespace', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  assert.doesNotThrow(() =>
    resolveDashboardNextActionLabels(runtime.localization),
  );
  assert.equal(
    runtime.localization.hasTranslation('dashboard.nextAction.title'),
    true,
  );
});

test('resolveDashboardNextActionEmptyContent and error content use localized defaults', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const empty = resolveDashboardNextActionEmptyContent(runtime.localization);
  const error = resolveDashboardNextActionErrorContent(runtime.localization);

  assert.equal(empty.title, 'No actions available');
  assert.equal(empty.description, 'New actions will appear here.');
  assert.equal(error.title, 'Action unavailable');
  assert.equal(error.description, 'Please try again later.');
});
