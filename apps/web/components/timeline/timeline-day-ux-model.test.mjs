import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import {
  groupTimelineEventsByDayPeriod,
  resolveTimelineDayPeriodKey,
  resolveTimelineEventDayPeriodKey,
} from './timeline-day-period-model.ts';
import {
  deriveTimelineDayMapModel,
  getTimelineCurrentTimePositionPercent,
  getTimelineEventPositionPercent,
  TIMELINE_DAY_MAP_COLLISION_THRESHOLD_MINUTES,
} from './timeline-day-map-model.ts';
import {
  clampTimelineSelectedDateKey,
  createTimelineDayNavigationModel,
  resolveDefaultTimelineSelectedDateKey,
} from './timeline-day-navigation-model.ts';
import { DEFAULT_TIMELINE_DATE_FILTER } from './timeline-date-filter-model.ts';
import {
  createTimelineDayViewModel,
  filterTimelineEventsForSelectedDay,
} from './timeline-day-view-model.ts';

function createLegacyEvent(id, dateTime, kind = 'glucose') {
  return {
    dateTime,
    id,
    kind,
    source: 'test',
    title: id,
    value: '6.4 mmol/L',
  };
}

function createEvent(id, dateTime, kind = 'glucose') {
  const [event] = liftLegacyTestFixtures([
    createLegacyEvent(id, dateTime, kind),
  ]);

  return event;
}

const referenceDate = new Date('2026-08-25T12:00:00.000Z');
const timeZone = 'UTC';

test('A midnight event maps to NIGHT', () => {
  assert.equal(resolveTimelineDayPeriodKey(0), 'night');
  assert.equal(
    resolveTimelineEventDayPeriodKey('2026-08-25T00:00:00.000Z', timeZone),
    'night',
  );
});

test('B 05:59 maps to NIGHT', () => {
  assert.equal(resolveTimelineDayPeriodKey(5 * 60 + 59), 'night');
});

test('C 06:00 maps to MORNING', () => {
  assert.equal(resolveTimelineDayPeriodKey(6 * 60), 'morning');
});

test('D 11:59 maps to MORNING', () => {
  assert.equal(resolveTimelineDayPeriodKey(11 * 60 + 59), 'morning');
});

test('E 12:00 maps to DAY', () => {
  assert.equal(resolveTimelineDayPeriodKey(12 * 60), 'day');
});

test('F 17:59 maps to DAY', () => {
  assert.equal(resolveTimelineDayPeriodKey(17 * 60 + 59), 'day');
});

test('G 18:00 maps to EVENING', () => {
  assert.equal(resolveTimelineDayPeriodKey(18 * 60), 'evening');
});

test('H 23:59 maps to EVENING', () => {
  assert.equal(resolveTimelineDayPeriodKey(23 * 60 + 59), 'evening');
});

test('I empty day period groups are hidden', () => {
  const groups = groupTimelineEventsByDayPeriod(
    [createEvent('morning', '2026-08-25T07:00:00.000Z')],
    timeZone,
  );

  assert.deepEqual(
    groups.map((group) => group.key),
    ['morning'],
  );
});

test('J day period groups expose correct event counts', () => {
  const groups = groupTimelineEventsByDayPeriod(
    [
      createEvent('morning-1', '2026-08-25T07:00:00.000Z'),
      createEvent('morning-2', '2026-08-25T09:00:00.000Z'),
      createEvent('day-1', '2026-08-25T14:00:00.000Z', 'activity'),
    ],
    timeZone,
  );

  assert.equal(groups.find((group) => group.key === 'morning')?.eventCount, 2);
  assert.equal(groups.find((group) => group.key === 'day')?.eventCount, 1);
});

test('K events inside a day period stay chronologically ordered', () => {
  const groups = groupTimelineEventsByDayPeriod(
    [
      createEvent('later', '2026-08-25T09:00:00.000Z'),
      createEvent('earlier', '2026-08-25T07:00:00.000Z'),
    ],
    timeZone,
  );

  assert.deepEqual(
    groups[0]?.events.map((event) => event.id),
    ['earlier', 'later'],
  );
});

test('L timeline marker position matches event time', () => {
  assert.equal(
    getTimelineEventPositionPercent('2026-08-25T12:00:00.000Z', timeZone),
    50,
  );
});

test('M filtered day map markers only include supplied marker inputs', () => {
  const event = createEvent('insulin-1', '2026-08-25T07:05:00.000Z', 'insulin');
  const model = deriveTimelineDayMapModel(
    [
      {
        ariaLabel: '07:05 Insulin NovoRapid',
        category: 'insulin',
        event,
        timeLabel: '07:05',
        title: 'NovoRapid',
      },
    ],
    {
      clusterAriaLabel: (count) => `${count} events`,
      isSelectedDayToday: false,
      referenceDate,
      timeZone,
    },
  );

  assert.equal(model.markers.length, 1);
  assert.equal(model.singles[0]?.marker.eventId, 'insulin-1');
});

test('N timezone calendar boundaries keep midnight events on selected day', () => {
  const events = filterTimelineEventsForSelectedDay(
    [createEvent('night-event', '2026-08-25T04:30:00.000Z')],
    '2026-08-25',
    'America/New_York',
  );

  assert.equal(events.length, 1);
});

test('O today enables current-time indicator eligibility', () => {
  const model = deriveTimelineDayMapModel([], {
    clusterAriaLabel: (count) => `${count} events`,
    isSelectedDayToday: true,
    referenceDate: new Date('2026-08-25T15:30:00.000Z'),
    timeZone,
  });

  assert.notEqual(model.currentTimePercent, null);
});

test('P non-today hides current-time indicator', () => {
  const model = deriveTimelineDayMapModel([], {
    clusterAriaLabel: (count) => `${count} events`,
    isSelectedDayToday: false,
    referenceDate,
    timeZone,
  });

  assert.equal(model.currentTimePercent, null);
});

test('Q events older than 45 days are not mutated by day view derivation', () => {
  const oldEvent = createEvent('old', '2025-01-01T08:00:00.000Z');
  const sourceEvents = Object.freeze([oldEvent]);
  const viewModel = createTimelineDayViewModel({
    clusterAriaLabel: (count) => `${count} events`,
    dateFilter: DEFAULT_TIMELINE_DATE_FILTER,
    dayNavigationLabels: { todayPrefix: 'Today' },
    dayPeriodLabels: {
      day: 'Day',
      evening: 'Evening',
      morning: 'Morning',
      night: 'Night',
    },
    dayPeriodTimeRangeLabels: {
      day: '12:00–17:59',
      evening: '18:00–23:59',
      morning: '06:00–11:59',
      night: '00:00–05:59',
    },
    events: sourceEvents,
    locale: 'en-GB',
    mapMarkerInputs: [],
    referenceDate,
    selectedDateKey: '2026-08-25',
    timeZone,
  });

  assert.equal(sourceEvents[0]?.id, 'old');
  assert.equal(viewModel.selectedDayEvents.length, 0);
});

test('S collision strategy clusters nearby markers deterministically', () => {
  const first = createEvent('first', '2026-08-25T09:00:00.000Z');
  const second = createEvent('second', '2026-08-25T09:10:00.000Z');
  const model = deriveTimelineDayMapModel(
    [
      {
        ariaLabel: '09:00 Glucose',
        category: 'glucose',
        event: first,
        timeLabel: '09:00',
        title: 'Glucose',
      },
      {
        ariaLabel: '09:10 Insulin',
        category: 'insulin',
        event: second,
        timeLabel: '09:10',
        title: 'NovoRapid',
      },
    ],
    {
      clusterAriaLabel: (count) => `${count} events`,
      isSelectedDayToday: false,
      referenceDate,
      timeZone,
    },
  );

  assert.equal(model.clusters.length, 1);
  assert.equal(model.clusters[0]?.eventIds.length, 2);
  assert.ok(
    TIMELINE_DAY_MAP_COLLISION_THRESHOLD_MINUTES >= 10,
    'collision threshold should cover a 10-minute gap',
  );
});

test('day navigation defaults to today and clamps inside active window', () => {
  const defaultDateKey = resolveDefaultTimelineSelectedDateKey(
    DEFAULT_TIMELINE_DATE_FILTER,
    referenceDate,
    timeZone,
  );

  assert.equal(defaultDateKey, '2026-08-25');
  assert.equal(
    clampTimelineSelectedDateKey(
      '2020-01-01',
      DEFAULT_TIMELINE_DATE_FILTER,
      referenceDate,
      timeZone,
    ),
    '2026-07-27',
  );
});

test('day navigation labels include Today prefix for current day', () => {
  const model = createTimelineDayNavigationModel(
    '2026-08-25',
    DEFAULT_TIMELINE_DATE_FILTER,
    referenceDate,
    timeZone,
    { todayPrefix: 'Today' },
    'en-GB',
  );

  assert.match(model?.label ?? '', /^Today,/);
  assert.equal(
    getTimelineCurrentTimePositionPercent(referenceDate, timeZone),
    50,
  );
});
