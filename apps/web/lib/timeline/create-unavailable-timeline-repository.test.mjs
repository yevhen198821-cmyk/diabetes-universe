import assert from 'node:assert/strict';
import test from 'node:test';
import { createUnavailableTimelineRepository } from './create-unavailable-timeline-repository.ts';

test('unresolved ownership never reports successful medical writes', async () => {
  const repository = createUnavailableTimelineRepository();
  await repository.initialize();
  for (const operation of [
    () => repository.addEvent({ id: 'synthetic' }),
    () => repository.updateEvent({ id: 'synthetic' }),
    () => repository.deleteEvent('synthetic'),
    () => repository.replaceEvents([]),
  ]) {
    await assert.rejects(operation, {
      code: 'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE',
    });
  }
  assert.deepEqual(repository.getSnapshot().events, []);
});
