import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '../index.ts';

function glucose(id, occurredAt, value = 6.4) {
  return {
    id,
    kind: 'glucose',
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    schemaVersion: 1,
    source: 'demo',
    concentrationMmolPerL: value,
  };
}

function insulin(id, occurredAt, doseUnits = 4) {
  return {
    id,
    kind: 'insulin',
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    schemaVersion: 1,
    source: 'demo',
    preparation: 'NovoRapid',
    doseUnits,
  };
}

const events = [
  glucose('g-1', '2026-08-09T08:00:00.000Z'),
  insulin('i-1', '2026-08-09T08:05:00.000Z'),
  glucose('g-2', '2026-08-09T08:10:00.000Z', 7.1),
  glucose('g-3', '2026-08-09T08:10:00.000Z', 7.2),
  insulin('i-2', '2026-08-09T08:20:00.000Z', 5),
];

test('getById returns a clone and null for a missing event', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  const found = await repository.getById('g-1');
  assert.equal(found?.id, 'g-1');
  found.concentrationMmolPerL = 99;
  assert.equal((await repository.getById('g-1'))?.concentrationMmolPerL, 6.4);
  assert.equal(await repository.getById('missing'), null);
});

test('queryEvents returns bounded ascending pages with deterministic id tie-break', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  const first = await repository.queryEvents({
    order: 'occurredAt-asc',
    limit: 2,
  });
  assert.deepEqual(first.events.map((event) => event.id), ['g-1', 'i-1']);
  assert.ok(first.nextCursor);

  const second = await repository.queryEvents({
    order: 'occurredAt-asc',
    limit: 2,
    cursor: first.nextCursor,
  });
  assert.deepEqual(second.events.map((event) => event.id), ['g-2', 'g-3']);
  assert.ok(second.nextCursor);

  const third = await repository.queryEvents({
    order: 'occurredAt-asc',
    limit: 2,
    cursor: second.nextCursor,
  });
  assert.deepEqual(third.events.map((event) => event.id), ['i-2']);
  assert.equal(third.nextCursor, undefined);
});

test('queryEvents supports descending and kind-filtered reads', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  const result = await repository.queryEvents({
    kinds: ['glucose'],
    order: 'occurredAt-desc',
    limit: 2,
  });

  assert.deepEqual(result.events.map((event) => event.id), ['g-3', 'g-2']);
  assert.ok(result.nextCursor);
});

test('queryEvents applies an occurredAt half-open range', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  const result = await repository.queryEvents({
    occurredFrom: '2026-08-09T08:05:00.000Z',
    occurredTo: '2026-08-09T08:20:00.000Z',
    order: 'occurredAt-asc',
    limit: 10,
  });

  assert.deepEqual(result.events.map((event) => event.id), ['i-1', 'g-2', 'g-3']);
});

test('queryEvents rejects invalid and query-incompatible cursors', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  await assert.rejects(
    () =>
      repository.queryEvents({
        order: 'occurredAt-asc',
        limit: 2,
        cursor: 'not-a-cursor',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );

  const first = await repository.queryEvents({
    kinds: ['glucose'],
    order: 'occurredAt-asc',
    limit: 1,
  });

  await assert.rejects(
    () =>
      repository.queryEvents({
        kinds: ['insulin'],
        order: 'occurredAt-asc',
        limit: 1,
        cursor: first.nextCursor,
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );
});

test('queryEvents enforces a mandatory implementation-bounded limit', async () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();

  for (const limit of [0, -1, 1.5, IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT + 1]) {
    await assert.rejects(
      () => repository.queryEvents({ order: 'occurredAt-asc', limit }),
      (error) =>
        error instanceof TimelineRepositoryError &&
        error.code === 'TIMELINE_REPOSITORY_READ_FAILED',
    );
  }
});
