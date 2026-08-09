import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInMemoryTimelineRepository,
  InMemoryTimelineRepository,
} from '@diabetes-universe/timeline';

import { createWebTimelineRepository } from './create-web-timeline-repository.ts';

test('createWebTimelineRepository uses an injected repository when provided', () => {
  const repository = createInMemoryTimelineRepository({ seedEvents: [] });

  assert.equal(createWebTimelineRepository({ repository }), repository);
});

test('createWebTimelineRepository falls back to in-memory when indexedDB is unavailable', () => {
  const originalIndexedDb = globalThis.indexedDB;
  // @ts-expect-error test override
  delete globalThis.indexedDB;

  try {
    const repository = createWebTimelineRepository();

    assert.ok(repository instanceof InMemoryTimelineRepository);
  } finally {
    globalThis.indexedDB = originalIndexedDb;
  }
});
