import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CANONICAL_TRANSLATION_KEYS,
  englishCanonicalMessages,
} from '../../../../packages/locales/src/index.ts';

import {
  dashboardLastGlucoseTimeTranslationKeys,
  dashboardLastGlucoseTranslationKeys,
} from './dashboard-last-glucose-labels.ts';

const DASHBOARD_LAST_GLUCOSE_KEYS = Object.values(
  dashboardLastGlucoseTranslationKeys,
);

test('dashboard last glucose translation keys are canonical and non-empty in English resources', () => {
  for (const key of DASHBOARD_LAST_GLUCOSE_KEYS) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }
});

test('dashboard last glucose keys stay hierarchical under dashboard namespace', () => {
  for (const key of DASHBOARD_LAST_GLUCOSE_KEYS) {
    assert.match(key, /^dashboard\.lastGlucose\./);
  }
});

test('dashboard last glucose keys do not duplicate dashboard header or next action keys', () => {
  const otherPrefixes = ['dashboard.header.', 'dashboard.nextAction.'];
  const duplicates = DASHBOARD_LAST_GLUCOSE_KEYS.filter((key) =>
    otherPrefixes.some((prefix) => key.startsWith(prefix)),
  );

  assert.equal(duplicates.length, 0);
});

test('dashboard last glucose time translation keys are canonical and non-empty in English resources', () => {
  const timeKeys = Object.values(dashboardLastGlucoseTimeTranslationKeys);

  for (const key of timeKeys) {
    assert.equal(CANONICAL_TRANSLATION_KEYS.includes(key), true);
    assert.equal(typeof englishCanonicalMessages[key], 'string');
    assert.equal(englishCanonicalMessages[key].trim().length > 0, true);
  }

  assert.equal(timeKeys.length, 3);
});

test('dashboard last glucose exposes exactly nine translation keys', () => {
  assert.equal(DASHBOARD_LAST_GLUCOSE_KEYS.length, 9);
});
