import 'fake-indexeddb/auto';

import assert from 'node:assert/strict';
import test from 'node:test';

import { TimelineRepositoryError } from '@diabetes-universe/timeline';

import { createWebTimelineRepository } from './create-web-timeline-repository.ts';
import { createSemanticGlucoseTimelineEvent } from './semantic-creators/create-semantic-glucose-timeline-event.ts';
import { createSemanticMedicationTimelineEvent } from './semantic-creators/create-semantic-medication-timeline-event.ts';
import { createAuthenticatedTimelineDatabaseName } from './timeline-local-ownership.ts';

const fixedClock = {
  now: () => new Date('2026-08-02T10:15:00.000Z'),
};

async function deleteDatabase(databaseName) {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(undefined);
    request.onerror = () => reject(request.error);
    request.onblocked = () => resolve(undefined);
  });
}

async function queryAllEvents(repository) {
  const page = await repository.queryEvents({
    limit: 100,
    order: 'occurredAt-asc',
  });
  return page.events;
}

function wrapWriteFailures(inner, hooks) {
  return {
    addEvent: async (event) => {
      if (hooks.failNextAdd) {
        hooks.failNextAdd = false;
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return inner.addEvent(event);
    },
    deleteEvent: (eventId) => inner.deleteEvent(eventId),
    getById: (eventId) => inner.getById(eventId),
    getSnapshot: () => inner.getSnapshot(),
    initialize: () => inner.initialize(),
    queryEvents: (query) => inner.queryEvents(query),
    replaceEvents: (events) => inner.replaceEvents(events),
    updateEvent: async (event) => {
      if (hooks.failNextUpdate) {
        hooks.failNextUpdate = false;
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
      }

      return inner.updateEvent(event);
    },
  };
}

test('rejected IndexedDB add is not durable and retry writes exactly one record', async () => {
  const databaseName =
    createAuthenticatedTimelineDatabaseName('remediation-0b-add');
  await deleteDatabase(databaseName);

  const inner = createWebTimelineRepository({ databaseName });
  const hooks = { failNextAdd: true, failNextUpdate: false };
  const repository = wrapWriteFailures(inner, hooks);
  const event = createSemanticMedicationTimelineEvent(
    {
      dose: 500,
      medication: { id: 'metformin', name: 'Метформин' },
      time: '08:15',
      unit: 'мг',
    },
    { clock: fixedClock, id: 'medication-0815-idb' },
  );

  try {
    await repository.initialize();
    await assert.rejects(repository.addEvent(event));
    assert.equal(await repository.getById(event.id), null);
    assert.equal((await queryAllEvents(repository)).length, 0);

    await repository.addEvent(event);
    assert.equal((await repository.getById(event.id))?.id, event.id);
    assert.equal((await queryAllEvents(repository)).length, 1);

    inner.close?.();

    const reloaded = createWebTimelineRepository({ databaseName });
    await reloaded.initialize();
    try {
      const loaded = await queryAllEvents(reloaded);
      assert.equal(loaded.length, 1);
      assert.equal(loaded[0]?.id, 'medication-0815-idb');
      assert.equal(loaded[0]?.medicationName, 'Метформин');
    } finally {
      reloaded.close?.();
    }
  } finally {
    inner.close?.();
    await deleteDatabase(databaseName);
  }
});

test('rejected IndexedDB edit leaves the original record and retry updates the same id', async () => {
  const databaseName = createAuthenticatedTimelineDatabaseName(
    'remediation-0b-edit',
  );
  await deleteDatabase(databaseName);

  const inner = createWebTimelineRepository({ databaseName });
  const hooks = { failNextAdd: false, failNextUpdate: true };
  const repository = wrapWriteFailures(inner, hooks);
  const original = createSemanticGlucoseTimelineEvent(
    { time: '08:00', valueMmol: 6.4 },
    { clock: fixedClock, id: 'glucose-0800-idb' },
  );
  const updated = {
    ...original,
    concentrationMmolPerL: 7.2,
    updatedAt: '2026-09-07T12:00:00.000Z',
  };

  try {
    await repository.initialize();
    await repository.addEvent(original);

    await assert.rejects(repository.updateEvent(updated));
    assert.equal(
      (await repository.getById(original.id))?.concentrationMmolPerL,
      6.4,
    );

    await repository.updateEvent(updated);
    const afterRetry = await repository.getById(original.id);
    assert.equal(afterRetry?.id, 'glucose-0800-idb');
    assert.equal(afterRetry?.concentrationMmolPerL, 7.2);
    assert.equal(afterRetry?.createdAt, original.createdAt);
    assert.equal((await queryAllEvents(repository)).length, 1);

    inner.close?.();

    const reloaded = createWebTimelineRepository({ databaseName });
    await reloaded.initialize();
    try {
      const loaded = await reloaded.getById('glucose-0800-idb');
      assert.equal(loaded?.concentrationMmolPerL, 7.2);
      assert.equal(loaded?.id, original.id);
      assert.equal((await queryAllEvents(reloaded)).length, 1);
    } finally {
      reloaded.close?.();
    }
  } finally {
    inner.close?.();
    await deleteDatabase(databaseName);
  }
});

test('pending Account A IndexedDB write cannot appear in Account B after reload', async () => {
  const accountAName = createAuthenticatedTimelineDatabaseName(
    'remediation-0b-account-a',
  );
  const accountBName = createAuthenticatedTimelineDatabaseName(
    'remediation-0b-account-b',
  );
  await deleteDatabase(accountAName);
  await deleteDatabase(accountBName);

  const repositoryA = createWebTimelineRepository({
    databaseName: accountAName,
  });
  const repositoryB = createWebTimelineRepository({
    databaseName: accountBName,
  });
  let releaseA = () => {};
  const pendingA = new Promise((resolve) => {
    releaseA = resolve;
  });
  const originalAddA = repositoryA.addEvent.bind(repositoryA);
  repositoryA.addEvent = async (event) => {
    await pendingA;
    return originalAddA(event);
  };

  const eventA = createSemanticMedicationTimelineEvent(
    {
      dose: 500,
      medication: { id: 'metformin', name: 'Метформин' },
      time: '11:00',
      unit: 'мг',
    },
    { clock: fixedClock, id: 'medication-a-pending' },
  );

  try {
    await repositoryA.initialize();
    await repositoryB.initialize();

    const addA = repositoryA.addEvent(eventA);
    assert.equal(await repositoryB.getById(eventA.id), null);

    releaseA();
    await addA;

    assert.equal((await repositoryA.getById(eventA.id))?.id, eventA.id);
    assert.equal(await repositoryB.getById(eventA.id), null);
    assert.equal((await queryAllEvents(repositoryB)).length, 0);
  } finally {
    repositoryA.close?.();
    repositoryB.close?.();
    await deleteDatabase(accountAName);
    await deleteDatabase(accountBName);
  }
});
