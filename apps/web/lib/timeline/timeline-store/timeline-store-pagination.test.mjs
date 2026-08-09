import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  TimelineRepositoryError,
} from '@diabetes-universe/timeline';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

after(() => {
  teardownIntegrationDom();
});

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
  const events = Array.from({ length: 150 }, (_, index) =>
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

async function flushAsyncWork() {
  await act(async () => {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  });
}

async function waitFor(predicate, description, maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (predicate()) {
      return;
    }

    await flushAsyncWork();
  }

  throw new Error(`Timed out waiting for ${description}`);
}

async function mountTimelineStore({ repository } = {}) {
  setupIntegrationDom();

  let currentStore;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function StoreProbe() {
    const store = useTimelineStore();
    currentStore = store;

    return createElement('div', {
      'data-event-count': String(store.events.length),
      'data-has-more-history': String(store.hasMoreHistory),
      'data-history-status': store.historyLoadStatus,
      'data-status': store.status,
      'data-testid': 'timeline-store-probe',
    });
  }

  await act(async () => {
    root.render(
      createElement(
        TimelineStoreProvider,
        { repository },
        createElement(StoreProbe),
      ),
    );
  });

  return {
    get currentStore() {
      if (!currentStore) {
        throw new Error('Timeline store was not rendered.');
      }

      return currentStore;
    },
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

test('store hydrates the first repository page and exposes history pagination', async () => {
  const mounted = await mountTimelineStore({
    repository: new PaginatedQueryRepository(),
  });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    assert.equal(mounted.currentStore.events.length, 100);
    assert.equal(mounted.currentStore.hasMoreHistory, true);
    assert.equal(mounted.currentStore.events[0]?.id, 'event-149');
  } finally {
    await mounted.unmount();
  }
});

test('store loadMoreHistory appends the next repository page', async () => {
  const mounted = await mountTimelineStore({
    repository: new PaginatedQueryRepository(),
  });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    await act(async () => {
      mounted.currentStore.loadMoreHistory();
    });

    await waitFor(
      () => mounted.currentStore.events.length === 150,
      'second history page',
    );

    assert.equal(mounted.currentStore.hasMoreHistory, false);
    assert.equal(mounted.currentStore.events.at(-1)?.id, 'event-000');
  } finally {
    await mounted.unmount();
  }
});

test('invalid history cursor surfaces a history load error without crashing the store', async () => {
  const repository = new PaginatedQueryRepository();
  const originalQueryEvents = repository.queryEvents.bind(repository);
  let callCount = 0;

  repository.queryEvents = async (query) => {
    callCount += 1;

    if (callCount === 1) {
      return originalQueryEvents(query);
    }

    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_INVALID_CURSOR');
  };

  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(() => mounted.currentStore.status === 'ready', 'ready state');

    await act(async () => {
      mounted.currentStore.loadMoreHistory();
    });

    await waitFor(
      () =>
        mounted.currentStore.historyLoadErrorCode ===
        'TIMELINE_REPOSITORY_INVALID_CURSOR',
      'history load error',
    );

    assert.equal(mounted.currentStore.status, 'ready');
    assert.equal(mounted.currentStore.events.length, 100);
    assert.equal(mounted.currentStore.hasMoreHistory, false);
  } finally {
    await mounted.unmount();
  }
});
