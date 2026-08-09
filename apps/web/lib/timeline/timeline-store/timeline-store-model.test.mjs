import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createReadyTimelineStoreState,
  initialTimelineStoreState,
  timelineStoreReducer,
} from './timeline-store-model.ts';

const glucoseSemantic = {
  concentrationMmolPerL: 6.4,
  context: 'before_meal',
  createdAt: '2026-08-09T08:30:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  occurredAt: '2026-08-02T05:00:00.000Z',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:30:00.000Z',
};

const insulinSemantic = {
  createdAt: '2026-08-09T08:30:00.000Z',
  doseUnits: 4,
  id: 'insulin-0805',
  kind: 'insulin',
  occurredAt: '2026-08-02T05:05:00.000Z',
  preparation: 'NovoRapid',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:30:00.000Z',
};

test('setReady stores semantic repository snapshot as ready state', () => {
  const state = timelineStoreReducer(initialTimelineStoreState, {
    events: [insulinSemantic, glucoseSemantic],
    type: 'setReady',
  });

  assert.equal(state.status, 'ready');
  assert.deepEqual(
    state.events.map((event) => event.id),
    ['insulin-0805', 'glucose-0800'],
  );

  assert.notEqual(state.events[0], insulinSemantic);
});

test('createReadyTimelineStoreState clones semantic events', () => {
  const mutableEvent = { ...glucoseSemantic };
  const state = createReadyTimelineStoreState([mutableEvent]);

  mutableEvent.concentrationMmolPerL = 9.9;

  assert.equal(state.events[0].concentrationMmolPerL, 6.4);
});

test('setLoading resets to empty loading projection', () => {
  const previousState = createReadyTimelineStoreState([glucoseSemantic]);
  const nextState = timelineStoreReducer(previousState, {
    type: 'setLoading',
  });

  assert.equal(nextState.status, 'loading');
  assert.deepEqual(nextState.events, []);
  assert.equal(nextState.error, undefined);
});

test('setError keeps existing semantic events and stores machine-readable error code', () => {
  const previousState = createReadyTimelineStoreState([glucoseSemantic]);
  const nextState = timelineStoreReducer(previousState, {
    errorCode: 'TIMELINE_REPOSITORY_INITIALIZE_FAILED',
    type: 'setError',
  });

  assert.equal(nextState.status, 'error');
  assert.equal(nextState.error, undefined);
  assert.equal(nextState.errorCode, 'TIMELINE_REPOSITORY_INITIALIZE_FAILED');
  assert.equal(nextState.events, previousState.events);
});
