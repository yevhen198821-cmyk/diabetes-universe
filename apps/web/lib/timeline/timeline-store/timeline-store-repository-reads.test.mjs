import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  TimelineRepositoryError,
} from '@diabetes-universe/timeline';

import {
  loadTimelineRepositoryFirstPage,
  loadTimelineRepositoryNextPage,
  mergeTimelineRepositoryEvents,
  TIMELINE_STORE_REPOSITORY_PAGE_SIZE,
} from './timeline-store-repository-reads.ts';

function createEvent(id, occurredAt) {
  return {
    concentrationMmolPerL: 6.4,
    createdAt: occurredAt,
    id,
    kind: 'glucose',
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: occurredAt,
  };
}

function createDescendingPageQuery(query) {
  const events = Array.from({ length: 250 }, (_, index) =>
    createEvent(
      `event-${String(index).padStart(3, '0')}`,
      new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(),
    ),
  ).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  let filtered = events;

  if (query.cursor) {
    const cursor = JSON.parse(decodeURIComponent(query.cursor));
    filtered = events.filter((event) => {
      const comparison = event.occurredAt.localeCompare(cursor.occurredAt);
      if (comparison !== 0) {
        return comparison < 0;
      }

      return event.id.localeCompare(cursor.id) < 0;
    });
  }

  const page = filtered.slice(0, query.limit);
  const hasMore = filtered.length > query.limit;
  const lastEvent = page.at(-1);

  return {
    events: page,
    nextCursor:
      hasMore && lastEvent
        ? encodeURIComponent(
            JSON.stringify({
              version: 1,
              occurredAt: lastEvent.occurredAt,
              id: lastEvent.id,
              signature: JSON.stringify({
                kinds: query.kinds ? [...query.kinds].sort() : undefined,
                occurredFrom: query.occurredFrom,
                occurredTo: query.occurredTo,
                order: query.order,
              }),
            }),
          )
        : undefined,
  };
}

class PaginatedQueryRepository {
  async initialize() {}

  getSnapshot() {
    return { events: [] };
  }

  async queryEvents(query) {
    if (query.limit > IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
    }

    return createDescendingPageQuery(query);
  }

  async addEvent() {
    return { status: 'applied' };
  }

  async updateEvent() {
    return { status: 'not-found' };
  }

  async deleteEvent() {
    return { status: 'not-found' };
  }

  async replaceEvents() {
    return { status: 'applied' };
  }
}

test('loads the first bounded repository page in descending order', async () => {
  const repository = new PaginatedQueryRepository();
  const page = await loadTimelineRepositoryFirstPage(repository, 100);

  assert.equal(page.events.length, 100);
  assert.equal(page.events[0]?.id, 'event-249');
  assert.equal(page.hasMoreHistory, true);
  assert.ok(page.nextCursor);
});

test('loads the next repository page using the returned cursor', async () => {
  const repository = new PaginatedQueryRepository();
  const firstPage = await loadTimelineRepositoryFirstPage(repository, 100);
  const secondPage = await loadTimelineRepositoryNextPage(
    repository,
    firstPage.nextCursor,
    100,
  );

  assert.equal(secondPage.events.length, 100);
  assert.equal(secondPage.events[0]?.id, 'event-149');
  assert.equal(secondPage.hasMoreHistory, true);

  const thirdPage = await loadTimelineRepositoryNextPage(
    repository,
    secondPage.nextCursor,
    100,
  );

  assert.equal(thirdPage.events.length, 50);
  assert.equal(thirdPage.hasMoreHistory, false);
  assert.equal(thirdPage.nextCursor, undefined);
});

test('mergeTimelineRepositoryEvents deduplicates by id', () => {
  const first = createEvent('a', '2026-08-09T08:00:00.000Z');
  const updated = {
    ...first,
    concentrationMmolPerL: 7.2,
  };

  const merged = mergeTimelineRepositoryEvents([first], [updated]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.concentrationMmolPerL, 7.2);
});

test('uses the approved default repository page size', () => {
  assert.equal(TIMELINE_STORE_REPOSITORY_PAGE_SIZE, 100);
});
