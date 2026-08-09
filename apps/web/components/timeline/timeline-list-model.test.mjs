import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { createTimelineListModel } from './timeline-list-model.ts';

const referenceDate = new Date('2026-08-02T12:00:00.000Z');

function createLegacyEvent(id, dateTime, kind = 'glucose') {
  const base = { dateTime, id, kind, source: 'test' };

  switch (kind) {
    case 'activity':
      return { ...base, title: 'Прогулка', unit: 'минут', value: '30' };
    case 'glucose':
      return { ...base, title: 'Глюкоза', value: '6,4 ммоль/л' };
    case 'insulin':
      return { ...base, title: 'NovoRapid', value: '4 ЕД' };
    case 'medication':
      return { ...base, title: 'Метформин', unit: 'мг', value: '500' };
    case 'note':
      return { ...base, title: 'Заметка', value: 'Тест' };
    case 'nutrition':
      return { ...base, title: 'Завтрак', value: '42 г углеводов' };
    default:
      return { ...base, title: id, value: '6,4 ммоль/л' };
  }
}

function createEvent(id, dateTime, kind = 'glucose') {
  const [event] = liftLegacyTestFixtures([
    createLegacyEvent(id, dateTime, kind),
  ]);

  return event;
}

test('creates loading model without groups', () => {
  const model = createTimelineListModel({
    events: [createEvent('glucose-1', '2026-08-02T08:00:00.000Z')],
    hasActiveCriteria: true,
    referenceDate,
    status: 'loading',
    timeZone: 'UTC',
    totalSourceEventCount: 1,
  });

  assert.equal(model.status, 'loading');
  assert.equal(model.totalEventCount, 0);
  assert.deepEqual(model.groups, []);
});

test('creates empty model for ready state without events', () => {
  const model = createTimelineListModel({
    events: [],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.equal(model.status, 'empty');
  assert.equal(model.totalEventCount, 0);
});

test('creates filtered-empty model when criteria hide existing events', () => {
  const model = createTimelineListModel({
    events: [],
    hasActiveCriteria: true,
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
    totalSourceEventCount: 3,
  });

  assert.equal(model.status, 'filtered-empty');
  assert.equal(model.totalEventCount, 0);
});

test('creates error model with safe fallback message', () => {
  const model = createTimelineListModel({
    error: '',
    events: [],
    hasActiveCriteria: true,
    referenceDate,
    status: 'error',
    timeZone: 'UTC',
    totalSourceEventCount: 3,
  });

  assert.equal(model.status, 'error');
  assert.equal(
    model.errorMessage,
    'Попробуйте обновить страницу или вернуться позже.',
  );
});

test('creates ready model for one date with newest events first', () => {
  const model = createTimelineListModel({
    events: [
      createEvent('older', '2026-08-02T08:00:00.000Z'),
      createEvent('newer', '2026-08-02T09:00:00.000Z'),
    ],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.equal(model.status, 'ready');
  assert.equal(model.totalEventCount, 2);
  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].label, 'Сегодня');
  assert.deepEqual(
    model.groups[0].events.map((event) => event.id),
    ['newer', 'older'],
  );
});

test('creates separate today, yesterday, and older date groups', () => {
  const model = createTimelineListModel({
    events: [
      createEvent('older-date', '2026-07-30T18:00:00.000Z'),
      createEvent('today', '2026-08-02T08:00:00.000Z'),
      createEvent('yesterday', '2026-08-01T21:00:00.000Z'),
    ],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.deepEqual(
    model.groups.map((group) => group.dateKey),
    ['2026-08-02', '2026-08-01', '2026-07-30'],
  );
  assert.deepEqual(
    model.groups.map((group) => group.label),
    ['Сегодня', 'Вчера', '30 июля'],
  );
});

test('shows year for groups outside the current year', () => {
  const model = createTimelineListModel({
    events: [createEvent('last-year', '2025-12-31T10:00:00.000Z')],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.equal(model.groups[0].label, '31 декабря 2025 г.');
});

test('keeps same dateTime events stable by id', () => {
  const model = createTimelineListModel({
    events: [
      createEvent('same-b', '2026-08-02T08:00:00.000Z'),
      createEvent('same-a', '2026-08-02T08:00:00.000Z'),
    ],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.deepEqual(
    model.groups[0].events.map((event) => event.id),
    ['same-a', 'same-b'],
  );
});

test('places invalid dateTime in a predictable fallback group', () => {
  const validEvent = createEvent('valid', '2026-08-02T08:00:00.000Z');
  const invalidEvent = {
    ...createEvent('invalid', '2026-08-02T08:00:00.000Z'),
    occurredAt: 'not-a-date',
  };
  const model = createTimelineListModel({
    events: [invalidEvent, validEvent],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.deepEqual(
    model.groups.map((group) => group.dateKey),
    ['2026-08-02', 'invalid-date'],
  );
  assert.equal(model.groups[1].label, 'Дата неизвестна');
});

test('does not mutate the input event array', () => {
  const input = [
    createEvent('second', '2026-08-02T09:00:00.000Z'),
    createEvent('first', '2026-08-02T08:00:00.000Z'),
  ];
  const originalOrder = input.map((event) => event.id);

  createTimelineListModel({
    events: input,
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
  });

  assert.deepEqual(
    input.map((event) => event.id),
    originalOrder,
  );
});

test('groups by supplied local timezone date', () => {
  const model = createTimelineListModel({
    events: [
      createEvent('tokyo-aug-2', '2026-08-01T16:30:00.000Z'),
      createEvent('utc-aug-2', '2026-08-02T01:30:00.000Z'),
    ],
    referenceDate,
    status: 'ready',
    timeZone: 'Asia/Tokyo',
  });

  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].dateKey, '2026-08-02');
  assert.deepEqual(
    model.groups[0].events.map((event) => event.id),
    ['utc-aug-2', 'tokyo-aug-2'],
  );
});
