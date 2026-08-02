import assert from 'node:assert/strict';
import test from 'node:test';

import { createTimelinePaginationModel } from './timeline-pagination-model.ts';
import { createTimelineSearchFilterModel } from './timeline-search-filter-model.ts';

function event(id, overrides = {}) {
  return {
    dateTime: '2026-08-02T10:00:00.000Z',
    id,
    kind: 'note',
    source: 'demo',
    title: `История ${id}`,
    value: `Заметка ${id}`,
    ...overrides,
  };
}

function events(count) {
  return Array.from({ length: count }, (_, index) =>
    event(`event-${index + 1}`),
  );
}

test('returns empty model for empty events', () => {
  const model = createTimelinePaginationModel({
    events: [],
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.totalCount, 0);
  assert.equal(model.visibleCount, 0);
  assert.equal(model.remainingCount, 0);
  assert.equal(model.hasMore, false);
  assert.deepEqual(model.visibleEvents, []);
});

test('shows all events when fewer than pageSize', () => {
  const input = events(5);
  const model = createTimelinePaginationModel({
    events: input,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.visibleCount, 5);
  assert.equal(model.remainingCount, 0);
  assert.equal(model.hasMore, false);
  assert.deepEqual(model.visibleEvents, input);
});

test('shows exactly pageSize without hasMore', () => {
  const model = createTimelinePaginationModel({
    events: events(20),
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.visibleEvents.length, 20);
  assert.equal(model.hasMore, false);
  assert.equal(model.nextVisibleCount, 20);
});

test('limits visible events and reports remainingCount', () => {
  const model = createTimelinePaginationModel({
    events: events(45),
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.visibleEvents.length, 20);
  assert.equal(model.remainingCount, 25);
  assert.equal(model.hasMore, true);
  assert.equal(model.nextVisibleCount, 40);
});

test('supports multiple pages and caps nextVisibleCount', () => {
  const model = createTimelinePaginationModel({
    events: events(45),
    pageSize: 20,
    visibleCount: 40,
  });

  assert.equal(model.visibleEvents.length, 40);
  assert.equal(model.remainingCount, 5);
  assert.equal(model.nextVisibleCount, 45);
});

test('normalizes visibleCount below pageSize', () => {
  const model = createTimelinePaginationModel({
    events: events(30),
    pageSize: 20,
    visibleCount: 3,
  });

  assert.equal(model.visibleCount, 20);
});

test('normalizes visibleCount above totalCount', () => {
  const model = createTimelinePaginationModel({
    events: events(30),
    pageSize: 20,
    visibleCount: 100,
  });

  assert.equal(model.visibleCount, 30);
  assert.equal(model.remainingCount, 0);
});

test('does not mutate input array', () => {
  const input = events(25);
  const before = input.map((item) => item.id);

  createTimelinePaginationModel({
    events: input,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.deepEqual(
    input.map((item) => item.id),
    before,
  );
});

test('paginates search results after filtering', () => {
  const filtered = createTimelineSearchFilterModel(
    [...events(25), event('other-1', { title: 'Метформин', value: '400' })],
    {
      filter: 'all',
      query: 'История',
    },
  );
  const model = createTimelinePaginationModel({
    events: filtered.filteredEvents,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(filtered.resultCount, 25);
  assert.equal(model.visibleEvents.length, 20);
  assert.equal(model.remainingCount, 5);
});

test('paginates filter results after filtering', () => {
  const filtered = createTimelineSearchFilterModel(
    [
      ...events(22),
      event('glucose-1', {
        kind: 'glucose',
        title: 'Глюкоза',
        value: '6,4 ммоль/л',
      }),
    ],
    {
      filter: 'note',
      query: '',
    },
  );
  const model = createTimelinePaginationModel({
    events: filtered.filteredEvents,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(filtered.resultCount, 22);
  assert.equal(model.visibleEvents.length, 20);
  assert.equal(model.hasMore, true);
});

test('reset to pageSize returns first page again', () => {
  const input = events(30);

  assert.equal(
    createTimelinePaginationModel({
      events: input,
      pageSize: 20,
      visibleCount: 40,
    }).visibleEvents.length,
    30,
  );
  assert.equal(
    createTimelinePaginationModel({
      events: input,
      pageSize: 20,
      visibleCount: 20,
    }).visibleEvents.length,
    20,
  );
});

test('delete from visible page recalculates remaining events', () => {
  const afterDelete = events(21).slice(1);
  const model = createTimelinePaginationModel({
    events: afterDelete,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.totalCount, 20);
  assert.equal(model.remainingCount, 0);
  assert.equal(model.hasMore, false);
});

test('add new event keeps input order and first page size', () => {
  const input = [event('new-top'), ...events(25)];
  const model = createTimelinePaginationModel({
    events: input,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.visibleEvents[0]?.id, 'new-top');
  assert.equal(model.visibleEvents.length, 20);
  assert.equal(model.remainingCount, 6);
});

test('equal dateTime ordering is preserved from input', () => {
  const input = [
    event('b', { dateTime: '2026-08-02T10:00:00.000Z' }),
    event('a', { dateTime: '2026-08-02T10:00:00.000Z' }),
  ];
  const model = createTimelinePaginationModel({
    events: input,
    pageSize: 20,
    visibleCount: 20,
  });

  assert.deepEqual(
    model.visibleEvents.map((item) => item.id),
    ['b', 'a'],
  );
});

test('invalid dateTime events remain available for list fallback grouping', () => {
  const invalid = event('invalid', { dateTime: 'invalid' });
  const model = createTimelinePaginationModel({
    events: [invalid],
    pageSize: 20,
    visibleCount: 20,
  });

  assert.equal(model.visibleEvents[0], invalid);
});
