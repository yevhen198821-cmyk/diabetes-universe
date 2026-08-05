import assert from 'node:assert/strict';
import test from 'node:test';

import { createTestPlatformRuntime } from '../../lib/platform/react/testing/create-test-platform-runtime.ts';
import {
  resolveDashboardNextActionEmptyContent,
  resolveDashboardNextActionErrorContent,
  resolveDashboardNextActionLabels,
  resolveNextActionInformationalContent,
  resolveNextActionReadyStep,
} from './dashboard-next-action-labels.ts';
import {
  NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY,
  NEXT_ACTION_DEFAULT_DESCRIPTION_KEY,
  NEXT_ACTION_DEFAULT_MESSAGE_KEY,
} from '../../lib/dashboard/next-action/next-action-default.ts';
import {
  NEXT_ACTION_FALLBACK_DESCRIPTION_KEY,
  NEXT_ACTION_FALLBACK_MESSAGE_KEY,
} from '../../lib/dashboard/next-action/next-action-fallback.ts';

test('resolveNextActionReadyStep maps quick-add presentation to NextStep', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const step = resolveNextActionReadyStep(runtime.localization, {
    actionLabelKey: NEXT_ACTION_DEFAULT_ACTION_LABEL_KEY,
    descriptionKey: NEXT_ACTION_DEFAULT_DESCRIPTION_KEY,
    messageKey: NEXT_ACTION_DEFAULT_MESSAGE_KEY,
  });

  assert.equal(step.title, 'Next action');
  assert.equal(step.description, 'Add insulin');
  assert.equal(step.actionLabel, 'Add');
  assert.ok('actionLabel' in step);
});

test('resolveNextActionInformationalContent maps none presentation without CTA', async () => {
  const runtime = await createTestPlatformRuntime({
    request: { acceptLanguage: 'en-GB', cookieTimeZone: 'Europe/London' },
  });

  const content = resolveNextActionInformationalContent(runtime.localization, {
    descriptionKey: NEXT_ACTION_FALLBACK_DESCRIPTION_KEY,
    messageKey: NEXT_ACTION_FALLBACK_MESSAGE_KEY,
  });

  assert.equal(content.title, 'Next action unavailable');
  assert.equal(
    content.description,
    'Next action details are temporarily unavailable.',
  );
  assert.equal('actionLabel' in content, false);
});

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
