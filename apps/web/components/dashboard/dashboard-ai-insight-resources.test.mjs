import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { dashboardAiInsightTranslationKeys } from './dashboard-ai-insight-labels.ts';

const DASHBOARD_AI_INSIGHT_KEYS = Object.values(
  dashboardAiInsightTranslationKeys,
);

test('dashboard ai insight translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_AI_INSIGHT_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard ai insight keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_AI_INSIGHT_KEYS) {
    assert.match(key, /^dashboard\.aiInsight\./);
  }
});

test('dashboard ai insight keys do not duplicate other dashboard block keys', () => {
  const otherPrefixes = [
    'dashboard.header.',
    'dashboard.nextAction.',
    'dashboard.lastGlucose.',
    'dashboard.daySummary.',
    'dashboard.recentEvents.',
  ];
  const duplicates = DASHBOARD_AI_INSIGHT_KEYS.filter((key) =>
    otherPrefixes.some((prefix) => key.startsWith(prefix)),
  );

  assert.equal(duplicates.length, 0);
});

test('dashboard ai insight exposes exactly nine translation keys', () => {
  assert.equal(DASHBOARD_AI_INSIGHT_KEYS.length, 9);
});

test('dashboard preload namespaces remain unchanged for ai insight keys', async () => {
  const { WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES } =
    await import('../../lib/platform/web-platform-defaults.ts');

  assert.deepEqual(WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES, [
    'common',
    'account',
    'dashboard',
    'timeline',
  ]);
});
