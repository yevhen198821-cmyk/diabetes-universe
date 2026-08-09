import assert from 'node:assert/strict';
import test from 'node:test';

import { createInMemoryTimelineRepository } from '../index.ts';

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
