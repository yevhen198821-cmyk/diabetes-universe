import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatTimelineCompactDateLabel,
  getTimelineCalendarDateKey,
  isTimelineCalendarDateKeyInInclusiveRange,
  shiftTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time.ts';
import {
  DEFAULT_TIMELINE_DATE_FILTER,
  formatTimelineDateFilterLabel,
  isValidTimelineDateFilterDateKey,
  matchesTimelineDateRange,
  resolveTimelineDateRange,
  resolveTimelineReferenceDateKey,
} from './timeline-date-filter-model.ts';
import {
  TEST_TIMELINE_DATE_FILTER_LABELS,
  TEST_TIMELINE_FILTER_REFERENCE_DATE,
  TEST_TIMELINE_FILTER_TIME_ZONE,
} from '../../lib/timeline/testing/create-test-timeline-filter-options.ts';

const labels = TEST_TIMELINE_DATE_FILTER_LABELS;
const referenceDate = TEST_TIMELINE_FILTER_REFERENCE_DATE;
const timeZone = TEST_TIMELINE_FILTER_TIME_ZONE;

test('validates timeline date filter date keys', () => {
  assert.equal(isValidTimelineDateFilterDateKey('2026-08-02'), true);
  assert.equal(isValidTimelineDateFilterDateKey('2026-8-02'), false);
  assert.equal(isValidTimelineDateFilterDateKey(undefined), false);
});

test('resolves today range with timezone-aware calendar day', () => {
  const range = resolveTimelineDateRange(
    { preset: 'today' },
    referenceDate,
    timeZone,
  );

  assert.deepEqual(range, {
    fromDateKey: '2026-08-02',
    toDateKey: '2026-08-02',
  });
});

test('resolves last 7 days as inclusive six-day lookback', () => {
  const range = resolveTimelineDateRange(
    { preset: '7days' },
    referenceDate,
    timeZone,
  );

  assert.deepEqual(range, {
    fromDateKey: '2026-07-27',
    toDateKey: '2026-08-02',
  });
});

test('resolves last 30 days as inclusive twenty-nine-day lookback', () => {
  const range = resolveTimelineDateRange(
    { preset: '30days' },
    referenceDate,
    timeZone,
  );

  assert.deepEqual(range, {
    fromDateKey: '2026-07-04',
    toDateKey: '2026-08-02',
  });
});

test('resolves custom range with inclusive boundaries and reversed input', () => {
  const range = resolveTimelineDateRange(
    {
      customFromDateKey: '2026-08-10',
      customToDateKey: '2026-08-02',
      preset: 'custom',
    },
    referenceDate,
    timeZone,
  );

  assert.deepEqual(range, {
    fromDateKey: '2026-08-02',
    toDateKey: '2026-08-10',
  });
});

test('returns null for invalid custom range', () => {
  assert.equal(
    resolveTimelineDateRange(
      {
        customFromDateKey: 'bad',
        customToDateKey: '2026-08-02',
        preset: 'custom',
      },
      referenceDate,
      timeZone,
    ),
    null,
  );
});

test('matches events using timezone calendar day near midnight', () => {
  const range = resolveTimelineDateRange(
    { preset: 'today' },
    referenceDate,
    timeZone,
  );

  assert.equal(range !== null, true);
  assert.equal(
    matchesTimelineDateRange('2026-08-02T23:59:59.000Z', range, timeZone),
    true,
  );
  assert.equal(
    matchesTimelineDateRange('2026-08-01T23:59:59.000Z', range, timeZone),
    false,
  );
});

test('matches events across DST boundaries in America/New_York', () => {
  const dstReference = new Date('2026-03-09T15:00:00.000Z');
  const range = resolveTimelineDateRange(
    { preset: 'today' },
    dstReference,
    'America/New_York',
  );

  assert.equal(range !== null, true);
  assert.equal(
    getTimelineCalendarDateKey('2026-03-09T06:30:00.000Z', 'America/New_York'),
    range.toDateKey,
  );
  assert.equal(
    matchesTimelineDateRange(
      '2026-03-09T06:30:00.000Z',
      range,
      'America/New_York',
    ),
    true,
  );
});

test('formats preset and custom labels', () => {
  assert.equal(
    formatTimelineDateFilterLabel(
      { preset: 'today' },
      labels,
      referenceDate,
      timeZone,
      'en-GB',
    ),
    'Today',
  );
  assert.equal(
    formatTimelineDateFilterLabel(
      { preset: '7days' },
      labels,
      referenceDate,
      timeZone,
      'en-GB',
    ),
    'Last 7 days',
  );
  assert.match(
    formatTimelineDateFilterLabel(
      {
        customFromDateKey: '2026-08-02',
        customToDateKey: '2026-08-14',
        preset: 'custom',
      },
      labels,
      referenceDate,
      timeZone,
      'en-GB',
    ),
    /2 Aug.*14 Aug/,
  );
});

test('calendar date helpers stay deterministic', () => {
  assert.equal(shiftTimelineCalendarDateKey('2026-08-02', -6), '2026-07-27');
  assert.equal(
    isTimelineCalendarDateKeyInInclusiveRange(
      '2026-08-02',
      '2026-08-02',
      '2026-08-14',
    ),
    true,
  );
  assert.equal(
    resolveTimelineReferenceDateKey(referenceDate, timeZone),
    '2026-08-02',
  );
  assert.equal(
    formatTimelineCompactDateLabel('2026-08-02', 'en-GB', timeZone),
    '2 Aug',
  );
});

test('default date filter uses last 30 days preset', () => {
  assert.deepEqual(DEFAULT_TIMELINE_DATE_FILTER, { preset: '30days' });
});
