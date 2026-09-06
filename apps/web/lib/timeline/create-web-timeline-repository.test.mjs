import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryTimelineRepository,
  TimelineRepositoryError,
} from '@diabetes-universe/timeline';

import { createWebTimelineRepository } from './create-web-timeline-repository.ts';
import { createAuthenticatedTimelineDatabaseName } from './timeline-local-ownership.ts';
import { timelineEvents as demoTimelineEvents } from '../mocks/timeline.ts';

test('createWebTimelineRepository uses an injected repository when provided', () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });

  assert.equal(createWebTimelineRepository({ repository }), repository);
});

test('createWebTimelineRepository requires an owned database name', () => {
  assert.throws(
    () => createWebTimelineRepository(),
    /explicit owned databaseName/,
  );
  assert.throws(
    () =>
      createWebTimelineRepository({
        databaseName: 'diabetes-universe-timeline',
      }),
    /Legacy unscoped/,
  );
});

test('createWebTimelineRepository fails closed when indexedDB is unavailable', async () => {
  const originalIndexedDb = globalThis.indexedDB;
  // @ts-expect-error test override
  delete globalThis.indexedDB;

  try {
    const repository = createWebTimelineRepository({
      databaseName: createAuthenticatedTimelineDatabaseName('acct-unavailable'),
    });

    await assert.rejects(
      () => repository.initialize(),
      (error) => {
        assert.ok(error instanceof TimelineRepositoryError);
        assert.equal(error.code, 'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE');
        return true;
      },
    );
  } finally {
    globalThis.indexedDB = originalIndexedDb;
  }
});

test('production repository creation does not seed demo medical events', async () => {
  const databaseName = createAuthenticatedTimelineDatabaseName('acct-empty');
  const repository = createWebTimelineRepository({ databaseName });

  await repository.initialize();
  const page = await repository.queryEvents({
    limit: 100,
    order: 'occurredAt-desc',
  });

  assert.equal(page.events.length, 0);
  assert.equal(
    demoTimelineEvents.some((event) =>
      page.events.some((loaded) => loaded.id === event.id),
    ),
    false,
  );

  repository.close();
});
