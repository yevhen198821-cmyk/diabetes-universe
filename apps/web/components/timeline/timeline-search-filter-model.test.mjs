import assert from 'node:assert/strict';
import test from 'node:test';

import { liftLegacyTestFixtures } from '../../lib/timeline/testing/lift-legacy-test-fixtures.ts';
import { createTestTimelinePresentationDependencies } from '../../lib/timeline/presentation/testing/create-test-timeline-presentation-dependencies.ts';
import {
  createTimelineSearchFilterModel,
  normalizeTimelineSearchQuery,
} from './timeline-search-filter-model.ts';

let presentationDependencies;

test.before(async () => {
  presentationDependencies = await createTestTimelinePresentationDependencies();
});

const legacyEvents = [
  {
    context: 'Перед завтраком',
    dateTime: '2026-08-02T05:00:00.000Z',
    id: 'glucose-1',
    kind: 'glucose',
    title: 'Глюкоза',
    value: '6,4 ммоль/л',
  },
  {
    context: 'Перед завтраком',
    dateTime: '2026-08-02T05:05:00.000Z',
    id: 'insulin-1',
    kind: 'insulin',
    title: 'NovoRapid',
    value: '4 ЕД',
  },
  {
    context: 'После еды',
    dateTime: '2026-08-02T04:30:00.000Z',
    id: 'medication-1',
    kind: 'medication',
    title: 'Метформин',
    unit: 'мг',
    value: '400',
  },
  {
    context: 'После инсулина',
    dateTime: '2026-08-02T05:20:00.000Z',
    id: 'nutrition-1',
    kind: 'nutrition',
    note: 'Без сахара',
    title: 'Завтрак',
    value: '42 г углеводов',
  },
  {
    context: 'После обеда',
    dateTime: '2026-08-01T12:00:00.000Z',
    id: 'activity-1',
    kind: 'activity',
    title: 'Walk',
    unit: 'минут',
    value: '30',
  },
  {
    dateTime: '2026-07-30T09:00:00.000Z',
    id: 'note-1',
    kind: 'note',
    title: 'Самочувствие',
    value: 'Чувствую усталость',
  },
];

const events = liftLegacyTestFixtures(legacyEvents);

function filter(query, filter = 'all') {
  return createTimelineSearchFilterModel(
    events,
    { filter, query },
    presentationDependencies,
  );
}

test('normalizes trim, case, and repeated spaces for runtime locale', () => {
  assert.equal(
    normalizeTimelineSearchQuery('  After   MEAL  ', 'en-GB'),
    'after meal',
  );
});

test('empty query with all filter returns every event', () => {
  const model = filter('');

  assert.equal(model.resultCount, events.length);
  assert.equal(model.hasActiveCriteria, false);
  assert.deepEqual(model.filteredEvents, events);
});

test('search is case-insensitive and supports partial title matches', () => {
  assert.deepEqual(
    filter('метФ').filteredEvents.map((event) => event.id),
    ['medication-1'],
  );
});

test('search matches value and unit', () => {
  assert.deepEqual(
    filter('400').filteredEvents.map((event) => event.id),
    ['medication-1'],
  );
  assert.deepEqual(
    filter('mg').filteredEvents.map((event) => event.id),
    ['medication-1'],
  );
});

test('search matches context and note', () => {
  assert.deepEqual(
    filter('после еды').filteredEvents.map((event) => event.id),
    ['medication-1'],
  );
  assert.deepEqual(
    filter('без сахара').filteredEvents.map((event) => event.id),
    ['nutrition-1'],
  );
});

test('search matches kind display label in runtime locale', () => {
  assert.deepEqual(
    filter('insulin').filteredEvents.map((event) => event.id),
    ['insulin-1'],
  );
  assert.deepEqual(
    filter('note').filteredEvents.map((event) => event.id),
    ['note-1'],
  );
});

test('search supports Latin text', () => {
  assert.deepEqual(
    filter('walk').filteredEvents.map((event) => event.id),
    ['activity-1'],
  );
});

test('search without matches returns empty results', () => {
  const model = filter('unknown');

  assert.equal(model.resultCount, 0);
  assert.equal(model.hasActiveSearch, true);
});

test('all filter does not restrict events', () => {
  const model = filter('', 'all');

  assert.equal(model.hasActiveFilter, false);
  assert.equal(model.resultCount, events.length);
});

test('filters by each timeline kind', () => {
  const cases = [
    ['glucose', 'glucose-1'],
    ['insulin', 'insulin-1'],
    ['nutrition', 'nutrition-1'],
    ['medication', 'medication-1'],
    ['activity', 'activity-1'],
    ['note', 'note-1'],
  ];

  for (const [eventFilter, expectedId] of cases) {
    const model = filter('', eventFilter);

    assert.equal(model.activeFilter, eventFilter);
    assert.equal(model.hasActiveFilter, true);
    assert.deepEqual(
      model.filteredEvents.map((event) => event.id),
      [expectedId],
    );
  }
});

test('combines search and filter criteria', () => {
  assert.deepEqual(
    filter('novo', 'insulin').filteredEvents.map((event) => event.id),
    ['insulin-1'],
  );
  assert.deepEqual(
    filter('novo', 'nutrition').filteredEvents.map((event) => event.id),
    [],
  );
});

test('does not mutate input events', () => {
  const originalOrder = events.map((event) => event.id);

  filter('glucose');

  assert.deepEqual(
    events.map((event) => event.id),
    originalOrder,
  );
});
