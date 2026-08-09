import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '../index.ts';

function createEvent(id, occurredAt, kind = 'glucose') {
  const envelope = {
    createdAt: '2026-08-09T08:30:00.000Z',
    id,
    occurredAt,
    schemaVersion: 1,
    source: 'demo',
    updatedAt: '2026-08-09T08:30:00.000Z',
  };

  switch (kind) {
    case 'insulin':
      return {
        ...envelope,
        doseUnits: 4,
        kind,
        preparation: 'NovoRapid',
      };
    case 'nutrition':
      return {
        ...envelope,
        carbohydratesGrams: 42,
        kind,
        mealType: 'breakfast',
        mode: 'manual',
      };
    case 'glucose':
    default:
      return {
        ...envelope,
        concentrationMmolPerL: 6.4,
        kind: 'glucose',
      };
  }
}

const events = [
  createEvent('glucose-0800', '2026-08-09T08:00:00.000Z'),
  createEvent('insulin-0810', '2026-08-09T08:10:00.000Z', 'insulin'),
  createEvent('nutrition-0820', '2026-08-09T08:20:00.000Z', 'nutrition'),
  createEvent('glucose-0830', '2026-08-09T08:30:00.000Z'),
  createEvent('insulin-0840', '2026-08-09T08:40:00.000Z', 'insulin'),
];

async function createReadyRepository() {
  const repository = createInMemoryTimelineRepository({ seedEvents: events });
  await repository.initialize();
  return repository;
}

test('bounded reads require repository initialization', async () => {
  const repository = createInMemoryTimelineRepository();

  await assert.rejects(
    () => repository.getById('glucose-0800'),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_NOT_INITIALIZED',
  );
  await assert.rejects(
    () =>
      repository.queryEvents({
        limit: 2,
        order: 'occurredAt-asc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_NOT_INITIALIZED',
  );
});

test('getById returns a cloned semantic event and null for a missing id', async () => {
  const repository = await createReadyRepository();
  const event = await repository.getById('glucose-0800');

  assert.equal(event?.id, 'glucose-0800');
  event.concentrationMmolPerL = 99;

  const reread = await repository.getById('glucose-0800');
  assert.equal(reread?.concentrationMmolPerL, 6.4);
  assert.equal(await repository.getById('missing'), null);
});

test('queryEvents paginates ascending by occurredAt then id', async () => {
  const repository = await createReadyRepository();
  const first = await repository.queryEvents({
    limit: 2,
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    first.events.map((event) => event.id),
    ['glucose-0800', 'insulin-0810'],
  );
  assert.ok(first.nextCursor);

  const second = await repository.queryEvents({
    cursor: first.nextCursor,
    limit: 2,
    order: 'occurredAt-asc',
  });
  assert.deepEqual(
    second.events.map((event) => event.id),
    ['nutrition-0820', 'glucose-0830'],
  );
  assert.ok(second.nextCursor);

  const third = await repository.queryEvents({
    cursor: second.nextCursor,
    limit: 2,
    order: 'occurredAt-asc',
  });
  assert.deepEqual(
    third.events.map((event) => event.id),
    ['insulin-0840'],
  );
  assert.equal(third.nextCursor, undefined);
});

test('queryEvents paginates descending deterministically', async () => {
  const repository = await createReadyRepository();
  const first = await repository.queryEvents({
    limit: 3,
    order: 'occurredAt-desc',
  });

  assert.deepEqual(
    first.events.map((event) => event.id),
    ['insulin-0840', 'glucose-0830', 'nutrition-0820'],
  );
  assert.ok(first.nextCursor);

  const second = await repository.queryEvents({
    cursor: first.nextCursor,
    limit: 3,
    order: 'occurredAt-desc',
  });
  assert.deepEqual(
    second.events.map((event) => event.id),
    ['insulin-0810', 'glucose-0800'],
  );
  assert.equal(second.nextCursor, undefined);
});

test('queryEvents applies half-open occurrence ranges', async () => {
  const repository = await createReadyRepository();
  const result = await repository.queryEvents({
    limit: 10,
    occurredFrom: '2026-08-09T08:10:00.000Z',
    occurredTo: '2026-08-09T08:40:00.000Z',
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['insulin-0810', 'nutrition-0820', 'glucose-0830'],
  );
});

test('queryEvents filters one or multiple kinds without widening the result', async () => {
  const repository = await createReadyRepository();
  const result = await repository.queryEvents({
    kinds: ['glucose', 'insulin'],
    limit: 10,
    order: 'occurredAt-asc',
  });

  assert.deepEqual(
    result.events.map((event) => event.id),
    ['glucose-0800', 'insulin-0810', 'glucose-0830', 'insulin-0840'],
  );
});

test('queryEvents rejects zero, fractional, and above-cap limits', async () => {
  const repository = await createReadyRepository();

  for (const limit of [0, 1.5, IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT + 1]) {
    await assert.rejects(
      () => repository.queryEvents({ limit, order: 'occurredAt-asc' }),
      (error) =>
        error instanceof TimelineRepositoryError &&
        error.code === 'TIMELINE_REPOSITORY_READ_FAILED',
    );
  }
});

test('queryEvents rejects malformed cursors', async () => {
  const repository = await createReadyRepository();

  await assert.rejects(
    () =>
      repository.queryEvents({
        cursor: 'not-a-valid-cursor',
        limit: 2,
        order: 'occurredAt-asc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );
});

test('queryEvents rejects a cursor reused with incompatible filters or order', async () => {
  const repository = await createReadyRepository();
  const first = await repository.queryEvents({
    kinds: ['glucose'],
    limit: 1,
    order: 'occurredAt-asc',
  });

  assert.ok(first.nextCursor);

  await assert.rejects(
    () =>
      repository.queryEvents({
        cursor: first.nextCursor,
        kinds: ['insulin'],
        limit: 1,
        order: 'occurredAt-asc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );
  await assert.rejects(
    () =>
      repository.queryEvents({
        cursor: first.nextCursor,
        kinds: ['glucose'],
        limit: 1,
        order: 'occurredAt-desc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );
});

test('queryEvents results cannot mutate repository state', async () => {
  const repository = await createReadyRepository();
  const first = await repository.queryEvents({
    limit: 1,
    order: 'occurredAt-asc',
  });

  first.events[0].concentrationMmolPerL = 99;

  const second = await repository.queryEvents({
    limit: 1,
    order: 'occurredAt-asc',
  });
  assert.equal(second.events[0].concentrationMmolPerL, 6.4);
});
