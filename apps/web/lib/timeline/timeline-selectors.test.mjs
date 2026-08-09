import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from './testing/lift-legacy-test-fixtures.ts';
import {
  getLatestGlucoseEvent,
  getRecentTimelineEvents,
  getTodayInsulinTotal,
  getTodayMedicationCount,
  getTodayNutritionTotal,
  getTodayTimelineEvents,
} from './timeline-selectors.ts';

const referenceDate = new Date('2026-08-02T12:00:00.000Z');

const legacyEvents = [
  {
    dateTime: '2026-08-02T05:00:00.000Z',
    id: 'glucose-0800',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
  },
  {
    dateTime: '2026-08-02T07:15:00.000Z',
    id: 'glucose-1015',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '7,3 ммоль/л',
  },
  {
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-today',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
  },
  {
    dateTime: '2026-08-01T05:05:00.000Z',
    id: 'insulin-yesterday',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '8 ЕД',
  },
  {
    dateTime: '2026-08-02T05:20:00.000Z',
    id: 'nutrition-today',
    kind: 'nutrition',
    title: 'Завтрак',
    value: '42 г углеводов',
  },
  {
    dateTime: '2026-08-01T05:20:00.000Z',
    id: 'nutrition-yesterday',
    kind: 'nutrition',
    title: 'Завтрак',
    value: '60 г углеводов',
  },
  {
    dateTime: '2026-08-02T04:30:00.000Z',
    id: 'medication-today',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '500',
  },
  {
    dateTime: '2026-08-01T04:30:00.000Z',
    id: 'medication-yesterday',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '500',
  },
  {
    dateTime: '2026-08-02T12:00:00.000Z',
    id: 'note-today',
    kind: 'note',
    title: 'Самочувствие',
    value: 'Усталость',
  },
];

const events = liftLegacyTestFixtures(legacyEvents);

test('gets latest glucose event by dateTime', () => {
  assert.equal(getLatestGlucoseEvent(events)?.id, 'glucose-1015');
});

test('gets recent timeline events for dashboard-compatible categories', () => {
  const recentEvents = getRecentTimelineEvents(events, {
    limit: 3,
    timeZone: 'UTC',
  });

  assert.deepEqual(
    recentEvents.map((event) => event.id),
    ['nutrition-today', 'insulin-today', 'medication-today'],
  );
});

test('filters events to today in the supplied timezone', () => {
  assert.deepEqual(
    getTodayTimelineEvents(events, referenceDate, 'UTC').map(
      (event) => event.id,
    ),
    [
      'medication-today',
      'glucose-0800',
      'insulin-today',
      'nutrition-today',
      'glucose-1015',
      'note-today',
    ],
  );
});

test('calculates insulin total only for today', () => {
  assert.equal(getTodayInsulinTotal(events, referenceDate, 'UTC'), 4);
});

test('calculates nutrition total only for today', () => {
  assert.equal(getTodayNutritionTotal(events, referenceDate, 'UTC'), 42);
});

test('counts medication events only for today', () => {
  assert.equal(getTodayMedicationCount(events, referenceDate, 'UTC'), 1);
});

test('respects timezone offsets for local day membership', () => {
  const boundaryEvents = liftLegacyTestFixtures([
    {
      dateTime: '2026-08-02T01:30:00.000Z',
      id: 'tokyo-today',
      kind: 'insulin',
      title: 'NovoRapid',
      value: '3 ЕД',
    },
    {
      dateTime: '2026-08-01T16:30:00.000Z',
      id: 'tokyo-previous-utc',
      kind: 'insulin',
      title: 'NovoRapid',
      value: '2 ЕД',
    },
  ]);

  assert.equal(
    getTodayInsulinTotal(
      boundaryEvents,
      new Date('2026-08-02T12:00:00.000Z'),
      'Asia/Tokyo',
    ),
    5,
  );
  assert.equal(
    getTodayInsulinTotal(
      boundaryEvents,
      new Date('2026-08-02T12:00:00.000Z'),
      'UTC',
    ),
    3,
  );
});
