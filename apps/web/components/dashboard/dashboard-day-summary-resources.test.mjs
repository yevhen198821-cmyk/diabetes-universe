import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
  germanTranslationResource,
  russianTranslationResource,
  ukrainianTranslationResource,
} from '../../../../packages/locales/src/index.ts';

import { dashboardDaySummaryTranslationKeyList } from './dashboard-day-summary-labels.ts';

const DASHBOARD_DAY_SUMMARY_KEYS = dashboardDaySummaryTranslationKeyList;

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

test('dashboard day summary exposes all day summary translation keys', () => {
  assert.equal(DASHBOARD_DAY_SUMMARY_KEYS.length, 29);
});

const GLUCOSE_MEASUREMENT_PLURAL_KEYS = [
  'dashboard.daySummary.metrics.glucoseMeasurements.one',
  'dashboard.daySummary.metrics.glucoseMeasurements.few',
  'dashboard.daySummary.metrics.glucoseMeasurements.many',
  'dashboard.daySummary.metrics.glucoseMeasurements.other',
];

test('glucose measurement plural keys exist in EN/RU/UK/DE without English fallback', () => {
  for (const key of GLUCOSE_MEASUREMENT_PLURAL_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }

  for (const [localeLabel, messages] of [
    ['ru-RU', russianTranslationResource.messages],
    ['uk-UA', ukrainianTranslationResource.messages],
    ['de-DE', germanTranslationResource.messages],
  ]) {
    for (const key of GLUCOSE_MEASUREMENT_PLURAL_KEYS) {
      if (localeLabel === 'de-DE' && (key.endsWith('.few') || key.endsWith('.many'))) {
        continue;
      }

      assert.equal(typeof messages[key], 'string', `${localeLabel} missing ${key}`);
      assert.equal(messages[key].trim().length > 0, true, `${localeLabel} empty ${key}`);
      assert.notEqual(
        messages[key],
        englishCanonicalMessages[key],
        `${localeLabel} still uses English for ${key}`,
      );
    }
  }
});

test('dashboard preload namespaces remain unchanged for day summary keys', async () => {
  const { WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES } =
    await import('../../lib/platform/web-platform-defaults.ts');

  assert.deepEqual(WEB_PLATFORM_APPLICATION_PRELOAD_NAMESPACES, [
    'common',
    'account',
    'dashboard',
    'timeline',
    'quick-add',
  ]);
});
