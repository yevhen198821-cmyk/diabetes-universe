import assert from 'node:assert/strict';
import test from 'node:test';

import {
  TimelineRepositoryError,
  createInMemoryTimelineRepository,
} from '../index.ts';

const glucoseEvent = {
  concentrationMmolPerL: 6.4,
  createdAt: '2026-08-09T08:00:00.000Z',
  id: 'glucose-0800',
  kind: 'glucose',
  occurredAt: '2026-08-09T08:00:00.000Z',
  schemaVersion: 1,
  source: 'demo',
  updatedAt: '2026-08-09T08:00:00.000Z',
};

async function createReadyRepository() {
  const repository = createInMemoryTimelineRepository({
    seedEvents: [glucoseEvent],
  });
  await repository.initialize();
  return repository;
}

test('queryEvents returns a bounded page', async () => {
  const repository = await createReadyRepository();
  const result = await repository.queryEvents({
    limit: 1,
    order: 'occurredAt-asc',
  });

  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].id, 'glucose-0800');
  assert.equal(result.nextCursor, undefined);
});

test('queryEvents rejects an invalid cursor', async () => {
  const repository = await createReadyRepository();

  await assert.rejects(
    () =>
      repository.queryEvents({
        cursor: 'invalid',
        limit: 1,
        order: 'occurredAt-asc',
      }),
    (error) =>
      error instanceof TimelineRepositoryError &&
      error.code === 'TIMELINE_REPOSITORY_INVALID_CURSOR',
  );
});
