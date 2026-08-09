import assert from 'node:assert/strict';
import test from 'node:test';

import { mapTimelineEventToCard } from '../../components/timeline/timeline-event-card.mapper.ts';
import { liftLegacyTestFixture } from './testing/lift-legacy-test-fixtures.ts';
import {
  compareTimelineDateTime,
  createIsoDateTimeFromLocalTime,
  formatTimelineDayGroupLabel,
  formatTimelineDisplayTime,
  getTimelineDayGroupKey,
  sortTimelineEvents,
} from './timeline-date-time.ts';

const referenceDate = new Date('2026-08-02T10:00:00.000Z');
const timeZone = 'Europe/Moscow';

test('creates ISO dateTime from selected local time', () => {
  const dateTime = createIsoDateTimeFromLocalTime('08:05', referenceDate);

  assert.equal(formatTimelineDisplayTime(dateTime), '08:05');
});

test('throws for invalid selected time values', () => {
  assert.throws(
    () => createIsoDateTimeFromLocalTime('25:00', referenceDate),
    /Invalid timeline time value/,
  );
});

test('sorts timeline events by dateTime and id', () => {
  const sorted = sortTimelineEvents([
    {
      dateTime: '2026-08-02T07:15:00.000Z',
      id: 'glucose-b',
      kind: 'glucose',
      title: 'Глюкоза',
      value: '7,3',
    },
    {
      dateTime: '2026-08-02T05:00:00.000Z',
      id: 'glucose-a',
      kind: 'glucose',
      title: 'Глюкоза',
      value: '6,4',
    },
    {
      dateTime: '2026-08-02T05:00:00.000Z',
      id: 'glucose-z',
      kind: 'glucose',
      title: 'Глюкоза',
      value: '6,1',
    },
  ]);

  assert.deepEqual(
    sorted.map((event) => event.id),
    ['glucose-a', 'glucose-z', 'glucose-b'],
  );
});

test('places invalid dateTime values after valid events during sorting', () => {
  const comparison = compareTimelineDateTime(
    'invalid-date',
    '2026-08-02T05:00:00.000Z',
  );

  assert.equal(comparison > 0, true);
});

test('creates today, yesterday, and earlier grouping labels', () => {
  assert.equal(
    getTimelineDayGroupKey('2026-08-02T05:00:00.000Z', referenceDate, timeZone),
    'today',
  );
  assert.equal(
    formatTimelineDayGroupLabel(
      'today',
      '2026-08-02T05:00:00.000Z',
      'ru-RU',
      timeZone,
    ),
    'Сегодня',
  );
  assert.equal(
    getTimelineDayGroupKey('2026-08-01T12:00:00.000Z', referenceDate, timeZone),
    'yesterday',
  );
  assert.equal(
    formatTimelineDayGroupLabel(
      'yesterday',
      '2026-08-01T12:00:00.000Z',
      'ru-RU',
      timeZone,
    ),
    'Вчера',
  );
  assert.equal(
    getTimelineDayGroupKey('2026-07-30T09:00:00.000Z', referenceDate, timeZone),
    'earlier',
  );
});

test('maps nutrition without legacy meal kind', () => {
  const card = mapTimelineEventToCard(
    liftLegacyTestFixture({
      context: 'После инсулина',
      dateTime: '2026-08-02T05:20:00.000Z',
      id: 'nutrition-0820',
      kind: 'nutrition',
      title: 'Завтрак',
      value: '42 г углеводов',
    }),
  );

  assert.equal(card.type, 'nutrition');
  assert.equal(
    card.time,
    formatTimelineDisplayTime('2026-08-02T05:20:00.000Z'),
  );
  assert.equal(card.value, '42');
});

test('maps all six timeline kinds to event cards', () => {
  const cases = [
    {
      event: {
        context: 'Перед завтраком',
        dateTime: '2026-08-02T05:00:00.000Z',
        id: 'glucose-1',
        kind: 'glucose',
        title: 'Глюкоза',
        value: '6,4 ммоль/л',
      },
      expectedType: 'glucose',
      expectedValue: '6,4',
    },
    {
      event: {
        context: 'Перед завтраком',
        dateTime: '2026-08-02T05:05:00.000Z',
        id: 'insulin-1',
        kind: 'insulin',
        title: 'NovoRapid',
        value: '4 ЕД',
      },
      expectedType: 'insulin',
      expectedValue: '4',
    },
    {
      event: {
        context: 'После инсулина',
        dateTime: '2026-08-02T05:20:00.000Z',
        id: 'nutrition-1',
        kind: 'nutrition',
        title: 'Завтрак',
        value: '42 г углеводов',
      },
      expectedType: 'nutrition',
      expectedValue: '42',
    },
    {
      event: {
        context: 'Утром',
        dateTime: '2026-08-02T04:30:00.000Z',
        id: 'medication-1',
        kind: 'medication',
        title: 'Метформин',
        unit: 'мг',
        value: '500',
      },
      expectedType: 'medication',
      expectedValue: '500',
    },
    {
      event: {
        context: 'После обеда',
        dateTime: '2026-08-01T12:00:00.000Z',
        id: 'activity-1',
        kind: 'activity',
        title: 'Прогулка',
        unit: 'минут',
        value: '30',
      },
      expectedType: 'activity',
      expectedValue: '30',
    },
    {
      event: {
        dateTime: '2026-07-30T09:00:00.000Z',
        id: 'note-1',
        kind: 'note',
        title: 'Самочувствие',
        value: 'Чувствую усталость после обеда',
      },
      expectedType: 'note',
      expectedValue: 'Чувствую усталость после обеда',
    },
  ];

  for (const testCase of cases) {
    const card = mapTimelineEventToCard(liftLegacyTestFixture(testCase.event));

    assert.equal(card.type, testCase.expectedType);
    assert.equal(card.value, testCase.expectedValue);
  }
});

test('does not confuse note kind with optional note field on other events', () => {
  const card = mapTimelineEventToCard(
    liftLegacyTestFixture({
      context: 'Введено вручную',
      dateTime: '2026-08-02T05:20:00.000Z',
      id: 'nutrition-note-field',
      kind: 'nutrition',
      note: 'Без сахара',
      title: 'Перекус',
      value: '15 г углеводов',
    }),
  );

  assert.equal(card.type, 'nutrition');
  assert.equal(card.context, undefined);
});
