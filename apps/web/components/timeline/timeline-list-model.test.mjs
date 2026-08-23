import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { createTimelineListModel } from './timeline-list-model.ts';

const referenceDate = new Date('2026-08-02T12:00:00.000Z');
const listLabels = {
  defaultErrorMessage: 'Try refreshing the page or come back later.',
  unknownDateLabel: 'Unknown date',
};

function createLegacyEvent(id, dateTime, kind = 'glucose') {
  const base = { dateTime, id, kind, source: 'test' };

  switch (kind) {
    case 'activity':
      return { ...base, title: 'Walk', unit: 'min', value: '30' };
    case 'glucose':
      return { ...base, title: 'Glucose', value: '6.4 mmol/L' };
    case 'insulin':
      return { ...base, title: 'NovoRapid', value: '4 U' };
    case 'medication':
      return { ...base, title: 'Metformin', unit: 'mg', value: '500' };
    case 'note':
      return { ...base, title: 'Note', value: 'Test' };
    case 'nutrition':
      return { ...base, title: 'Breakfast', value: '42 g carbs' };
    default:
      return { ...base, title: id, value: '6.4 mmol/L' };
  }
}

function createEvent(id, dateTime, kind = 'glucose') {
  const [event] = liftLegacyTestFixtures([
    createLegacyEvent(id, dateTime, kind),
  ]);

  return event;
}

function createModel(input) {
  return createTimelineListModel({
    ...listLabels,
    ...input,
  });
}

test('creates loading model without groups', () => {
  const model = createModel({
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
  const model = createModel({
    events: [],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
    locale: 'en-GB',
  });

  assert.equal(model.status, 'empty');
  assert.equal(model.totalEventCount, 0);
});

test('creates filtered-empty model when criteria hide existing events', () => {
  const model = createModel({
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
  const model = createModel({
    error: '',
    events: [],
    hasActiveCriteria: true,
    referenceDate,
    status: 'error',
    timeZone: 'UTC',
    totalSourceEventCount: 3,
  });

  assert.equal(model.status, 'error');
  assert.equal(model.errorMessage, listLabels.defaultErrorMessage);
});

test('creates ready model for one date with newest events first', () => {
  const model = createModel({
    events: [
      createEvent('older', '2026-08-02T08:00:00.000Z'),
      createEvent('newer', '2026-08-02T09:00:00.000Z'),
    ],
    groupLabels: {
      earlier: 'Earlier',
      today: 'Today',
      yesterday: 'Yesterday',
    },
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
    locale: 'en-GB',
  });

  assert.equal(model.status, 'ready');
  assert.equal(model.totalEventCount, 2);
  assert.equal(model.groups.length, 1);
  assert.equal(model.groups[0].label, 'Today');
  assert.deepEqual(
    model.groups[0].events.map((event) => event.id),
    ['newer', 'older'],
  );
});

test('places invalid dateTime in a predictable fallback group', () => {
  const validEvent = createEvent('valid', '2026-08-02T08:00:00.000Z');
  const invalidEvent = {
    ...createEvent('invalid', '2026-08-02T08:00:00.000Z'),
    occurredAt: 'not-a-date',
  };
  const model = createModel({
    events: [invalidEvent, validEvent],
    referenceDate,
    status: 'ready',
    timeZone: 'UTC',
    locale: 'en-GB',
  });

  assert.deepEqual(
    model.groups.map((group) => group.dateKey),
    ['2026-08-02', 'invalid-date'],
  );
  assert.equal(model.groups[1].label, listLabels.unknownDateLabel);
});
