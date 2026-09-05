import assert from 'node:assert/strict';
import test from 'node:test';

import { CANONICAL_TRANSLATION_KEYS } from '../../../../packages/locales/src/index.ts';
import { englishCanonicalMessages } from '../../../../packages/locales/src/resources/en/messages.ts';
import { russianCanonicalMessages } from '../../../../packages/locales/src/resources/ru/messages.ts';

const HOME_DASHBOARD_KEY_PREFIXES = [
  'dashboard.header.',
  'dashboard.lastGlucose.',
  'dashboard.daySummary.',
  'dashboard.navigation.',
  'dashboard.quickActions.',
  'dashboard.recentEvents.',
  'dashboard.nextAction.',
];

const HOME_DASHBOARD_KEY_EXCLUSIONS = new Set([
  'dashboard.header.brandLineAccent',
  'dashboard.header.brandLinePrimary',
  'dashboard.header.brandName',
]);

const HOME_TIMELINE_KEYS = [
  'timeline.eventKind.activity',
  'timeline.eventKind.glucose',
  'timeline.eventKind.insulin',
  'timeline.eventKind.nutrition',
  'timeline.eventKind.note',
  'timeline.mealType.breakfast',
  'timeline.units.insulinDose',
  'timeline.units.massG',
  'timeline.units.nutritionCarbs',
  'timeline.units.activityMinutes',
];

const homeDashboardKeys = CANONICAL_TRANSLATION_KEYS.filter(
  (key) =>
    HOME_DASHBOARD_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
    !HOME_DASHBOARD_KEY_EXCLUSIONS.has(key),
);

test('Russian Home dashboard keys are localized and differ from English placeholders', () => {
  for (const key of homeDashboardKeys) {
    const russianValue = russianCanonicalMessages[key];
    const englishValue = englishCanonicalMessages[key];

    assert.equal(typeof russianValue, 'string');
    assert.equal(typeof englishValue, 'string');
    assert.notEqual(
      russianValue,
      englishValue,
      `${key} must be translated for ru-RU Home`,
    );
    assert.ok(russianValue.trim().length > 0, `${key} must be non-empty`);
  }
});

test('Russian Home timeline presentation keys are localized', () => {
  for (const key of HOME_TIMELINE_KEYS) {
    const russianValue = russianCanonicalMessages[key];
    const englishValue = englishCanonicalMessages[key];

    assert.equal(typeof russianValue, 'string');
    assert.notEqual(
      russianValue,
      englishValue,
      `${key} must be translated for ru-RU Home`,
    );
  }
});
