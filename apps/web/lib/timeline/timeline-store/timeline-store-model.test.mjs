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

test('setReady stores the repository snapshot as ready state', () => {
  const state = timelineStoreReducer(initialTimelineStoreState, {
    events: [insulinLater, glucoseEarly],
    type: 'setReady',
  });

  assert.equal(state.status, 'ready');
  assert.deepEqual(
    state.events.map((event) => event.id),
    ['insulin-0805', 'glucose-0800'],
  );

  assert.notEqual(state.events[0], insulinLater);
});

test('createReadyTimelineStoreState clones repository snapshot events', () => {
  const mutableEvent = { ...glucoseEarly };
  const state = createReadyTimelineStoreState([mutableEvent]);

  mutableEvent.value = 'mutated outside store';

  assert.equal(state.events[0].value, '6,4 ммоль/л');
});

test('setLoading resets to empty loading projection', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    type: 'setLoading',
  });

  assert.equal(nextState.status, 'loading');
  assert.deepEqual(nextState.events, []);
  assert.equal(nextState.error, undefined);
});

test('setError keeps existing events and stores machine-readable error code', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    errorCode: 'TIMELINE_REPOSITORY_INITIALIZE_FAILED',
    type: 'setError',
  });

  assert.equal(nextState.status, 'error');
  assert.equal(nextState.error, undefined);
  assert.equal(nextState.errorCode, 'TIMELINE_REPOSITORY_INITIALIZE_FAILED');
  assert.equal(nextState.events, previousState.events);
});

test('setError can retain an application-layer presentation message', () => {
  const previousState = createReadyTimelineStoreState([glucoseEarly]);
  const nextState = timelineStoreReducer(previousState, {
    error: 'Failed to load timeline',
    type: 'setError',
  });

  assert.equal(nextState.status, 'error');
  assert.equal(nextState.error, 'Failed to load timeline');
  assert.equal(nextState.errorCode, 'TIMELINE_STORE_UNKNOWN_ERROR');
});
