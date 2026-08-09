import assert from 'node:assert/strict';
import { after } from 'node:test';
import { act } from 'react';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import test from 'node:test';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '@diabetes-universe/timeline';

import {
  setupIntegrationDom,
  teardownIntegrationDom,
} from '../../platform/integration/tests/integration-dom-setup.mjs';
import { TimelineStoreProvider, useTimelineStore } from './timeline-store.tsx';

after(() => {
  teardownIntegrationDom();
});

function createEvent(id, dateTime, overrides = {}) {
  return {
    dateTime,
    id,
    kind: 'glucose',
    title: id,
    value: id,
    ...overrides,
  };
}

function cloneEvents(events) {
  return events.map((event) => ({ ...event }));
}

function createDeferred() {
  let reject;
  let resolve;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
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

class DeferredInitializeRepository {
  #events;
  #initialized = false;
  initializeDeferred;

  constructor(seedEvents = []) {
    this.#events = cloneEvents(seedEvents);
    this.initializeDeferred = createDeferred();
  }

  async initialize() {
    await this.initializeDeferred.promise;
    this.#initialized = true;
  }

  getSnapshot() {
    this.#assertInitialized();

    return { events: cloneEvents(this.#events) };
  }

  async addEvent() {
    this.#assertInitialized();

    return { status: 'applied' };
  }

  async updateEvent() {
    this.#assertInitialized();

    return { status: 'applied' };
  }

  async deleteEvent() {
    this.#assertInitialized();

    return { status: 'applied' };
  }

  async replaceEvents(events) {
    this.#assertInitialized();
    this.#events = cloneEvents(events);

    return { status: 'applied' };
  }

  #assertInitialized() {
    if (!this.#initialized) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_NOT_INITIALIZED');
    }
  }
}

class FailingInitializeRepository extends DeferredInitializeRepository {
  async initialize() {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_INITIALIZE_FAILED');
  }
}

class SerializedMutationRepository {
  #events;
  #initialized = false;
  addCalls = [];
  addDeferreds = [];

  constructor(seedEvents = []) {
    this.#events = cloneEvents(seedEvents);
  }

  async initialize() {
    this.#initialized = true;
  }

  getSnapshot() {
    this.#assertInitialized();

    return { events: cloneEvents(this.#events) };
  }

  async addEvent(event) {
    this.#assertInitialized();
    this.addCalls.push(event.id);

    const deferred = createDeferred();
    this.addDeferreds.push({ deferred, event });

    await deferred.promise;
    this.#events = [...this.#events, { ...event }];

    return { status: 'applied' };
  }

  async updateEvent() {
    this.#assertInitialized();

    return { status: 'not-found' };
  }

  async deleteEvent() {
    this.#assertInitialized();

    return { status: 'not-found' };
  }

  async replaceEvents(events) {
    this.#assertInitialized();
    this.#events = cloneEvents(events);

    return { status: 'applied' };
  }

  #assertInitialized() {
    if (!this.#initialized) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_NOT_INITIALIZED');
    }
  }
}

async function mountTimelineStore({ initialEvents, repository } = {}) {
  setupIntegrationDom();

  const observations = [];
  let currentStore;
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  function StoreProbe() {
    const store = useTimelineStore();
    currentStore = store;
    observations.push({
      error: store.error,
      eventIds: store.events.map((event) => event.id),
      events: store.events.map((event) => ({ ...event })),
      status: store.status,
    });

    return createElement('div', {
      'data-event-ids': store.events.map((event) => event.id).join(','),
      'data-status': store.status,
      'data-testid': 'timeline-store-probe',
    });
  }

  await act(async () => {
    root.render(
      createElement(
        TimelineStoreProvider,
        { initialEvents, repository },
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
    observations,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      teardownIntegrationDom();
    },
  };
}

const glucoseEarly = createEvent('glucose-0800', '2026-08-02T05:00:00.000Z');
const insulinLater = createEvent('insulin-0805', '2026-08-02T05:05:00.000Z', {
  kind: 'insulin',
});
const nutritionLatest = createEvent(
  'nutrition-0820',
  '2026-08-02T05:20:00.000Z',
  {
    kind: 'nutrition',
  },
);

test('provider exposes initial loading state before repository initialization resolves', async () => {
  const repository = new DeferredInitializeRepository([glucoseEarly]);
  const mounted = await mountTimelineStore({ repository });

  try {
    assert.equal(mounted.observations.at(-1)?.status, 'loading');

    repository.initializeDeferred.resolve();
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );
  } finally {
    await mounted.unmount();
  }
});

test('provider initializes repository and renders seeded events', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [insulinLater, glucoseEarly],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, [
      'glucose-0800',
      'insulin-0805',
    ]);
  } finally {
    await mounted.unmount();
  }
});

test('provider maps initialization failure to error state', async () => {
  const mounted = await mountTimelineStore({
    repository: new FailingInitializeRepository(),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'error',
      'error state',
    );

    assert.equal(mounted.observations.at(-1)?.error, undefined);
    assert.deepEqual(mounted.observations.at(-1)?.eventIds, []);
  } finally {
    await mounted.unmount();
  }
});

test('addEvent delegates to repository and refreshes from repository snapshot', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.addEvent(insulinLater);
    });
    await waitFor(
      () => mounted.observations.at(-1)?.eventIds.includes('insulin-0805'),
      'added event',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, [
      'glucose-0800',
      'insulin-0805',
    ]);
  } finally {
    await mounted.unmount();
  }
});

test('duplicate add follows repository replacement semantics', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.addEvent({
        ...glucoseEarly,
        value: '7,0 ммоль/л',
      });
    });
    await waitFor(
      () => mounted.observations.at(-1)?.events[0]?.value === '7,0 ммоль/л',
      'repository replacement snapshot',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, ['glucose-0800']);
  } finally {
    await mounted.unmount();
  }
});

test('updateEvent delegates to repository and refreshes from repository snapshot', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly, insulinLater],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.updateEvent({
        ...insulinLater,
        value: '5 ЕД',
      });
    });
    await waitFor(
      () =>
        mounted.observations
          .at(-1)
          ?.events.find((event) => event.id === 'insulin-0805')?.value ===
        '5 ЕД',
      'updated repository snapshot',
    );
  } finally {
    await mounted.unmount();
  }
});

test('deleteEvent delegates to repository and refreshes from repository snapshot', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly, insulinLater],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.deleteEvent('glucose-0800');
    });
    await waitFor(
      () => !mounted.observations.at(-1)?.eventIds.includes('glucose-0800'),
      'deleted repository snapshot',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, ['insulin-0805']);
  } finally {
    await mounted.unmount();
  }
});

test('replaceEvents delegates transitional hydration to repository', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.replaceEvents([nutritionLatest, insulinLater]);
    });
    await waitFor(
      () => mounted.observations.at(-1)?.eventIds.includes('nutrition-0820'),
      'replacement repository snapshot',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, [
      'insulin-0805',
      'nutrition-0820',
    ]);
  } finally {
    await mounted.unmount();
  }
});

test('missing update and delete remain no-ops from the user perspective', async () => {
  const mounted = await mountTimelineStore({
    repository: createInMemoryTimelineRepository({
      seedEvents: [glucoseEarly],
    }),
  });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );
    const readyRenderCount = mounted.observations.length;

    await act(async () => {
      mounted.currentStore.updateEvent(insulinLater);
      mounted.currentStore.deleteEvent('unknown');
    });
    await flushAsyncWork();

    assert.equal(mounted.observations.at(-1)?.status, 'ready');
    assert.deepEqual(mounted.observations.at(-1)?.eventIds, ['glucose-0800']);
    assert.equal(mounted.observations.length, readyRenderCount);
  } finally {
    await mounted.unmount();
  }
});

test('mutations are serialized to prevent stale snapshot overwrite', async () => {
  const repository = new SerializedMutationRepository();
  const mounted = await mountTimelineStore({ repository });

  try {
    await waitFor(
      () => mounted.observations.at(-1)?.status === 'ready',
      'ready state',
    );

    await act(async () => {
      mounted.currentStore.addEvent(glucoseEarly);
      mounted.currentStore.addEvent(insulinLater);
    });
    await flushAsyncWork();

    assert.deepEqual(repository.addCalls, ['glucose-0800']);

    repository.addDeferreds[0].deferred.resolve();
    await waitFor(
      () => repository.addCalls.length === 2,
      'second serialized mutation start',
    );

    repository.addDeferreds[1].deferred.resolve();
    await waitFor(
      () => mounted.observations.at(-1)?.eventIds.includes('insulin-0805'),
      'second mutation snapshot',
    );

    assert.deepEqual(mounted.observations.at(-1)?.eventIds, [
      'glucose-0800',
      'insulin-0805',
    ]);
  } finally {
    await mounted.unmount();
  }
});

test('async initialization completion does not render after unmount', async () => {
  const repository = new DeferredInitializeRepository([glucoseEarly]);
  const mounted = await mountTimelineStore({ repository });

  assert.equal(mounted.observations.at(-1)?.status, 'loading');

  await mounted.unmount();

  repository.initializeDeferred.resolve();
  await flushAsyncWork();

  assert.equal(mounted.observations.length, 1);
  assert.equal(mounted.observations[0].status, 'loading');
});
