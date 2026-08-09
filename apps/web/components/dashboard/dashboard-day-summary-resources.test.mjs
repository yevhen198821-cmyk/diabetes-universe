import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { dashboardDaySummaryTranslationKeys } from './dashboard-day-summary-labels.ts';

const DASHBOARD_DAY_SUMMARY_KEYS = Object.values(
  dashboardDaySummaryTranslationKeys,
);

test('dashboard day summary translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_DAY_SUMMARY_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard day summary keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_DAY_SUMMARY_KEYS) {
    assert.match(key, /^dashboard\.daySummary\./);
  }
});

test('dashboard day summary keys do not duplicate other dashboard block keys', () => {
  const otherPrefixes = [
    'dashboard.header.',
    'dashboard.nextAction.',
    'dashboard.lastGlucose.',
  ];
  const duplicates = DASHBOARD_DAY_SUMMARY_KEYS.filter((key) =>
    otherPrefixes.some((prefix) => key.startsWith(prefix)),
  );

  assert.equal(duplicates.length, 0);
});

test('dashboard day summary exposes exactly eleven translation keys', () => {
  assert.equal(DASHBOARD_DAY_SUMMARY_KEYS.length, 11);
});

test('dashboard preload namespaces remain unchanged for day summary keys', async () => {
  const { WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES } =
    await import('../../lib/platform/web-platform-defaults.ts');

  assert.deepEqual(WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES, [
    'common',
    'dashboard',
    'timeline',
  ]);
});
