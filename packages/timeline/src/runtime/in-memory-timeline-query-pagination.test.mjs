import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '../index.ts';

function glucose(id, occurredAt) {
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

function insulin(id, occurredAt) {
  return {
    createdAt: occurredAt,
    doseUnits: 4,
    id,
    kind: 'insulin',
    occurredAt,
    preparation: 'NovoRapid',
    schemaVersion: 1,
    source: 'demo',
    updatedAt: occurredAt,
  };
}

function note(id, occurredAt) {
  return {
    body: 'test',
    createdAt: occurredAt,
    id,
    kind: 'note',
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: occurredAt,
  };
}

async function createRepository() {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [
      glucose('g1', '2026-08-09T08:00:00.000Z'),
      insulin('i1', '2026-08-09T08:10:00.000Z'),
      glucose('g2', '2026-08-09T08:20:00.000Z'),
      insulin('i2', '2026-08-09T08:30:00.000Z'),
    ],
  });
  await repository.initialize();
  return repository;
}

test('query cursor advances through ascending pages', async () => {
  const repository = await createRepository();
  const first = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-asc',
  });
  const second = await repository.queryEvents({
    cursor: first.nextCursor,
    limit: 2,
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    first.events.map((event) => event.id),
    ['g1', 'i1'],
  );
  assert.deepEqual(
    second.events.map((event) => event.id),
    ['g2', 'i2'],
  );
  assert.equal(second.nextCursor, undefined);
});

test('query cursor continues after its anchor event is deleted', async () => {
  const repository = await createRepository();
  const first = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-asc',
  });

  assert.ok(first.nextCursor);
  await repository.deleteEvent('i1');

  const second = await repository.queryEvents({
    cursor: first.nextCursor,
    limit: 2,
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    second.events.map((event) => event.id),
    ['g2', 'i2'],
  );
});

test('query supports descending order', async () => {
  const repository = await createRepository();
  const result = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-desc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['i2', 'g2'],
  );
});

test('query filters by kind', async () => {
  const repository = await createRepository();
  const result = await repository.queryEvents({
    kinds: ['glucose'],
    limit: 10,
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['g1', 'g2'],
  );
});

test('query uses a half-open occurrence range', async () => {
  const repository = await createRepository();
  const result = await repository.queryEvents({
    limit: 10,
    occurredFrom: '2026-08-09T08:10:00.000Z',
    occurredTo: '2026-08-09T08:30:00.000Z',
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['i1', 'g2'],
  );
});

test('query rejects malformed or inverted occurrence ranges', async () => {
  const repository = await createRepository();

  for (const query of [
    {
      limit: 10,
      occurredFrom: 'not-a-date',
      order: 'occurredAt-asc',
    },
    {
      limit: 10,
      occurredTo: 'not-a-date',
      order: 'occurredAt-asc',
    },
    {
      limit: 10,
      occurredFrom: '2026-08-09T09:00:00.000Z',
      occurredTo: '2026-08-09T08:00:00.000Z',
      order: 'occurredAt-asc',
    },
  ]) {
    await assert.rejects(
      () => repository.queryEvents(query),
      (error) =>
        error instanceof TimelineRepositoryError &&
        error.code === 'TIMELINE_REPOSITORY_READ_FAILED',
    );
  }
});

test('query fails closed when a sparse filter exceeds the explicit scan budget', async () => {
  const seedEvents = Array.from({ length: 1_001 }, (_, index) =>
    note(
      `note-${String(index).padStart(4, '0')}`,
      new Date(Date.UTC(2026, 7, 1, 0, 0, index)).toISOString(),
    ),
  );
  const repository = createInMemoryTimelineRepository({ seedEvents });
  await repository.initialize();

  await assert.rejects(
    () =>
      repository.queryEvents({
        kinds: ['glucose'],
        limit: 1,
        order: 'occurredAt-asc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_READ_FAILED',
  );
});
