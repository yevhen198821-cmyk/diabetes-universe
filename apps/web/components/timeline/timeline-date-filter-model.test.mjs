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
  matchesTimelineDateRange,
  resolveTimelineDateRange,
  resolveTimelineReferenceDateKey,
  TIMELINE_ACTIVE_WINDOW_MAX_CALENDAR_DAYS,
} from './timeline-date-filter-model.ts';
import {
  TEST_TIMELINE_DATE_FILTER_LABELS,
  TEST_TIMELINE_FILTER_REFERENCE_DATE,
  TEST_TIMELINE_FILTER_TIME_ZONE,
} from '../../lib/timeline/testing/create-test-timeline-filter-options.ts';

const labels = TEST_TIMELINE_DATE_FILTER_LABELS;
const referenceDate = TEST_TIMELINE_FILTER_REFERENCE_DATE;
const timeZone = TEST_TIMELINE_FILTER_TIME_ZONE;

test('active window maximum is 45 calendar days', () => {
  assert.equal(TIMELINE_ACTIVE_WINDOW_MAX_CALENDAR_DAYS, 45);
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

test('resolves last 45 days as inclusive forty-four-day lookback', () => {
  const range = resolveTimelineDateRange(
    { preset: '45days' },
    referenceDate,
    timeZone,
  );

  assert.deepEqual(range, {
    fromDateKey: '2026-06-19',
    toDateKey: '2026-08-02',
  });
});

test('includes event on 45-day boundary and excludes event outside it', () => {
  const range = resolveTimelineDateRange(
    { preset: '45days' },
    referenceDate,
    timeZone,
  );

  assert.equal(range !== null, true);
  assert.equal(
    matchesTimelineDateRange('2026-06-19T09:00:00.000Z', range, timeZone),
    true,
  );
  assert.equal(
    matchesTimelineDateRange('2026-06-18T23:59:59.000Z', range, timeZone),
    false,
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

test('formats preset labels', () => {
  assert.equal(
    formatTimelineDateFilterLabel({ preset: 'today' }, labels),
    'Today',
  );
  assert.equal(
    formatTimelineDateFilterLabel({ preset: '7days' }, labels),
    'Last 7 days',
  );
  assert.equal(
    formatTimelineDateFilterLabel({ preset: '30days' }, labels),
    'Last 30 days',
  );
  assert.equal(
    formatTimelineDateFilterLabel({ preset: '45days' }, labels),
    'Last 45 days',
  );
});

test('calendar date helpers stay deterministic', () => {
  assert.equal(shiftTimelineCalendarDateKey('2026-08-02', -44), '2026-06-19');
  assert.equal(
    isTimelineCalendarDateKeyInInclusiveRange(
      '2026-08-02',
      '2026-06-19',
      '2026-08-02',
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
