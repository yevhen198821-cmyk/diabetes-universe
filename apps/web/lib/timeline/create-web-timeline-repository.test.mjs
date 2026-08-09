import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryTimelineRepository,
  TimelineRepositoryError,
} from '@diabetes-universe/timeline';

import { createWebTimelineRepository } from './create-web-timeline-repository.ts';

test('createWebTimelineRepository uses an injected repository when provided', () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });

  assert.equal(createWebTimelineRepository({ repository }), repository);
});

test('createWebTimelineRepository fails closed when indexedDB is unavailable', async () => {
  const originalIndexedDb = globalThis.indexedDB;
  // @ts-expect-error test override
  delete globalThis.indexedDB;

  try {
    const repository = createWebTimelineRepository();

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
