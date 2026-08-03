import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import { dashboardRecentEventsTranslationKeys } from './dashboard-recent-events-labels.ts';

const BLOCK_KEYS = [
  dashboardRecentEventsTranslationKeys.defaultEmpty,
  dashboardRecentEventsTranslationKeys.defaultError,
  dashboardRecentEventsTranslationKeys.loading,
  dashboardRecentEventsTranslationKeys.title,
  dashboardRecentEventsTranslationKeys.unavailable,
  dashboardRecentEventsTranslationKeys.viewAll,
];

const CATEGORY_KEYS = Object.values(
  dashboardRecentEventsTranslationKeys.categories,
);

const DASHBOARD_RECENT_EVENTS_KEYS = [...BLOCK_KEYS, ...CATEGORY_KEYS];

test('dashboard recent events translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_RECENT_EVENTS_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard recent events keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_RECENT_EVENTS_KEYS) {
    assert.match(key, /^dashboard\.recentEvents\./);
  }
});

test('dashboard recent events keys do not duplicate other dashboard block keys', () => {
  const otherPrefixes = [
    'dashboard.header.',
    'dashboard.nextAction.',
    'dashboard.lastGlucose.',
    'dashboard.daySummary.',
  ];
  const duplicates = DASHBOARD_RECENT_EVENTS_KEYS.filter((key) =>
    otherPrefixes.some((prefix) => key.startsWith(prefix)),
  );

  assert.equal(duplicates.length, 0);
});

test('dashboard recent events exposes exactly ten translation keys', () => {
  assert.equal(DASHBOARD_RECENT_EVENTS_KEYS.length, 10);
});

test('dashboard preload namespaces remain unchanged for recent events keys', async () => {
  const { WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES } =
    await import('../../lib/platform/web-platform-defaults.ts');

  assert.deepEqual(WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES, [
    'common',
    'dashboard',
  ]);
});
