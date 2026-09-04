import assert from 'node:assert/strict';
import test from 'node:test';

import { CANONICAL_TRANSLATION_KEYS } from '../../../../packages/locales/src/index.ts';
import { englishCanonicalMessages } from '../../../../packages/locales/src/resources/en/messages.ts';
import { germanCanonicalMessages } from '../../../../packages/locales/src/resources/de/messages.ts';
import { russianCanonicalMessages } from '../../../../packages/locales/src/resources/ru/messages.ts';
import { ukrainianCanonicalMessages } from '../../../../packages/locales/src/resources/uk/messages.ts';
import {
  formatTimelineDayPeriodEventCount,
  formatTimelineToolbarResultLabel,
} from './timeline-ui-labels.ts';
import { formatTimelineDayNavigationDateLabel } from '../../lib/timeline/timeline-date-time.ts';

const TIMELINE_VARIANT_B_KEY_PREFIXES = [
  'timeline.header.',
  'timeline.shell.',
  'timeline.filter.',
  'timeline.filters.',
  'timeline.search.',
  'timeline.dateFilter.',
  'timeline.toolbar.',
  'timeline.filteredEmpty.',
  'timeline.periodEmpty.',
  'timeline.empty.',
  'timeline.dayEmpty.',
  'timeline.dayNavigation.',
  'timeline.eventsOfDay.',
  'timeline.eventCount.',
  'timeline.dayPeriod.',
  'timeline.detail.',
  'timeline.loading.',
  'timeline.list.',
  'timeline.historyLoad.',
  'timeline.topBar.',
  'timeline.group.',
  'timeline.eventCard.',
  'quick-add.button.label',
];

const TIMELINE_VARIANT_B_LOCALE_INVARIANT_KEYS = new Set([
  'timeline.dayPeriod.timeRange.day',
  'timeline.dayPeriod.timeRange.evening',
  'timeline.dayPeriod.timeRange.morning',
  'timeline.dayPeriod.timeRange.night',
]);

const TIMELINE_VARIANT_B_COGNATE_KEYS = new Set([
  'timeline.filter.insulin',
  'timeline.eventKind.insulin',
]);

const timelineVariantBKeys = CANONICAL_TRANSLATION_KEYS.filter(
  (key) =>
    TIMELINE_VARIANT_B_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) &&
    !TIMELINE_VARIANT_B_LOCALE_INVARIANT_KEYS.has(key),
);

function assertLocalizedBundle(bundle, localeCode) {
  for (const key of timelineVariantBKeys) {
    const localizedValue = bundle[key];
    const englishValue = englishCanonicalMessages[key];

    assert.equal(
      typeof localizedValue,
      'string',
      `${key} must exist for ${localeCode}`,
    );
    if (!TIMELINE_VARIANT_B_COGNATE_KEYS.has(key)) {
      assert.notEqual(
        localizedValue,
        englishValue,
        `${key} must be translated for ${localeCode}`,
      );
    }
    assert.ok(localizedValue.trim().length > 0, `${key} must be non-empty`);
  }
}

test('Russian Timeline Variant B keys are localized', () => {
  assertLocalizedBundle(russianCanonicalMessages, 'ru-RU');
});

test('Ukrainian Timeline Variant B keys are localized', () => {
  assertLocalizedBundle(ukrainianCanonicalMessages, 'uk-UA');
});

test('German Timeline Variant B keys are localized', () => {
  assertLocalizedBundle(germanCanonicalMessages, 'de-DE');
});

test('English Timeline chrome does not leak Russian strings in canonical messages', () => {
  for (const value of Object.values(englishCanonicalMessages)) {
    assert.doesNotMatch(value, /[А-Яа-яЁёІіЇїЄєҐґ]/);
  }
});

test('Russian toolbar and period counts share pluralization rules', () => {
  const labels = {
    few: russianCanonicalMessages['timeline.eventCount.few'],
    many: russianCanonicalMessages['timeline.eventCount.many'],
    one: russianCanonicalMessages['timeline.eventCount.one'],
    other: russianCanonicalMessages['timeline.eventCount.other'],
  };

  assert.equal(
    formatTimelineToolbarResultLabel(
      { eventCount: labels, noMatches: 'No matches' },
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 21 },
      'ru-RU',
      String,
    ),
    '21 событие',
  );
  assert.equal(
    formatTimelineDayPeriodEventCount(22, labels, 'ru-RU', String),
    '22 события',
  );
  assert.equal(
    formatTimelineDayPeriodEventCount(25, labels, 'ru-RU', String),
    '25 событий',
  );
});

test('Ukrainian event count pluralization matches product terminology', () => {
  const labels = {
    few: ukrainianCanonicalMessages['timeline.eventCount.few'],
    many: ukrainianCanonicalMessages['timeline.eventCount.many'],
    one: ukrainianCanonicalMessages['timeline.eventCount.one'],
    other: ukrainianCanonicalMessages['timeline.eventCount.other'],
  };

  assert.equal(
    formatTimelineToolbarResultLabel(
      { eventCount: labels, noMatches: 'No matches' },
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 0 },
      'uk-UA',
      String,
    ),
    '0 подій',
  );
  assert.equal(
    formatTimelineDayPeriodEventCount(21, labels, 'uk-UA', String),
    '21 подія',
  );
});

test('German event count pluralization matches product terminology', () => {
  const labels = {
    one: germanCanonicalMessages['timeline.eventCount.one'],
    other: germanCanonicalMessages['timeline.eventCount.other'],
  };

  assert.equal(
    formatTimelineToolbarResultLabel(
      { eventCount: labels, noMatches: 'No matches' },
      { hasActiveSearchOrCategoryCriteria: false, resultCount: 1 },
      'de-DE',
      String,
    ),
    '1 Ereignis',
  );
  assert.equal(
    formatTimelineDayPeriodEventCount(2, labels, 'de-DE', String),
    '2 Ereignisse',
  );
});

test('day navigation date labels use locale-aware long month formatting', () => {
  assert.match(
    formatTimelineDayNavigationDateLabel('2026-08-02', 'en-GB', 'UTC'),
    /^2 August$/,
  );
  assert.match(
    formatTimelineDayNavigationDateLabel('2026-08-02', 'ru-RU', 'UTC'),
    /^2 августа$/,
  );
  assert.match(
    formatTimelineDayNavigationDateLabel('2026-08-02', 'uk-UA', 'UTC'),
    /^2 серпня$/,
  );
  assert.match(
    formatTimelineDayNavigationDateLabel('2026-08-02', 'de-DE', 'UTC'),
    /^2\. August$/,
  );
});
