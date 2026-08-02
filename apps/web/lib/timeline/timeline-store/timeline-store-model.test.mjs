import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createReadyTimelineStoreState,
  initialTimelineStoreState,
  timelineStoreReducer,
} from './timeline-store-model.ts';

const glucoseEarly = {
  dateTime: '2026-08-02T05:00:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  title: 'Глюкоза',
  value: '6,4 ммоль/л',
};

const insulinLater = {
  dateTime: '2026-08-02T05:05:00.000Z',
  id: 'insulin-0805',
  kind: 'insulin',
  title: 'NovoRapid',
  value: '4 ЕД',
};

const nutritionLatest = {
  dateTime: '2026-08-02T05:20:00.000Z',
  id: 'nutrition-0820',
  kind: 'nutrition',
  title: 'Завтрак',
  value: '42 г углеводов',
};

test('initialize sorts events and sets ready state', () => {
  const state = timelineStoreReducer(initialTimelineStoreState, {
    events: [nutritionLatest, glucoseEarly, insulinLater],
    type: 'initialize',
  });

  assert.equal(state.status, 'ready');
  assert.deepEqual(
    state.events.map((event) => event.id),
    ['glucose-0800', 'insulin-0805', 'nutrition-0820'],
  );
});

test('add appends, sorts, and preserves immutability', () => {
  const previousState = createReadyTimelineStoreState([nutritionLatest]);
  const nextState = timelineStoreReducer(previousState, {
    event: glucoseEarly,
    type: 'add',
  });

  assert.notEqual(nextState, previousState);
  assert.notEqual(nextState.events, previousState.events);
  assert.deepEqual(
    nextState.events.map((event) => event.id),
    ['glucose-0800', 'nutrition-0820'],
  );
  assert.deepEqual(
    previousState.events.map((event) => event.id),
    ['nutrition-0820'],
  );
});

test('add with duplicate id replaces existing event', () => {
  const replacement = {
    ...glucoseEarly,
    dateTime: '2026-08-02T06:00:00.000Z',
    value: '7,0 ммоль/л',
  };
  const nextState = timelineStoreReducer(
    createReadyTimelineStoreState([glucoseEarly, insulinLater]),
    {
      event: replacement,
      type: 'add',
    },
  );

  assert.equal(nextState.events.length, 2);
  assert.equal(
    nextState.events.find((event) => event.id === 'glucose-0800')?.value,
    '7,0 ммоль/л',
  );
});

test('update changes an existing event without creating a new event', () => {
  const nextState = timelineStoreReducer(
    createReadyTimelineStoreState([glucoseEarly, insulinLater]),
    {
      event: {
        ...insulinLater,
        value: '5 ЕД',
      },
      type: 'update',
    },
  );

  assert.equal(nextState.events.length, 2);
  assert.equal(
    nextState.events.find((event) => event.id === 'insulin-0805')?.value,
    '5 ЕД',
  );
});

test('update unknown id is a no-op', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    event: insulinLater,
    type: 'update',
  });

  assert.equal(nextState, previousState);
});

test('delete removes an existing event', () => {
  const nextState = timelineStoreReducer(
    createReadyTimelineStoreState([glucoseEarly, insulinLater]),
    {
      eventId: 'glucose-0800',
      type: 'delete',
    },
  );

  assert.deepEqual(
    nextState.events.map((event) => event.id),
    ['insulin-0805'],
  );
});

test('delete unknown id is a no-op', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    eventId: 'unknown',
    type: 'delete',
  });

  assert.equal(nextState, previousState);
});

test('replace swaps the collection and sorts it', () => {
  const nextState = timelineStoreReducer(
    createReadyTimelineStoreState([glucoseEarly]),
    {
      events: [nutritionLatest, insulinLater],
      type: 'replace',
    },
  );

  assert.deepEqual(
    nextState.events.map((event) => event.id),
    ['insulin-0805', 'nutrition-0820'],
  );
});

test('setError keeps existing events and exposes error status', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    error: 'Failed to load timeline',
    type: 'setError',
  });

  assert.equal(nextState.status, 'error');
  assert.equal(nextState.error, 'Failed to load timeline');
  assert.equal(nextState.events, previousState.events);
});

test('invalid dateTime follows stable temporal fallback', () => {
  const invalidEvent = {
    ...nutritionLatest,
    dateTime: 'invalid',
    id: 'invalid-date',
  };
  const nextState = createReadyTimelineStoreState([invalidEvent, glucoseEarly]);

  assert.deepEqual(
    nextState.events.map((event) => event.id),
    ['glucose-0800', 'invalid-date'],
  );
});
