import 'fake-indexeddb/auto';
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMedicalServiceBundle,
  closeMedicalServiceBundle,
  resolveMedicalServiceEnvironment,
} from '@diabetes-universe/medical-service/server';
import {
  createIndexedDbTimelineRepository,
  enableTimelineSync,
  runTimelineSync,
  readTimelineSyncState,
  exportTimelineLocalData,
  openTimelineIndexedDB,
} from '@diabetes-universe/timeline-web';

Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { locks: { request: async (_name, callback) => callback() } },
});
const event = {
  id: 'local-one',
  kind: 'glucose',
  schemaVersion: 1,
  source: 'manual',
  occurredAt: '2026-08-14T10:00:00.000Z',
  createdAt: '2026-08-14T10:00:00.000Z',
  updatedAt: '2026-08-14T10:00:00.000Z',
  concentrationMmolPerL: 5.4,
};

async function setup() {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalServiceEnvironment({ NODE_ENV: 'test' }),
  );
  const relation =
    await bundle.subjectService.provisionSelfSubject('sync-integration');
  const scope = {
    accountId: 'sync-integration',
    subjectId: relation.subjectId,
    correlationId: 'sync-integration',
  };
  const transport = {
    push: async (request) => ({
      mutationId: request.mutationId,
      status: 'acknowledged',
      ...(await bundle.syncService.push(scope, request)),
    }),
    pull: async (cursor) => {
      const result = await bundle.syncService.pull(scope, cursor);
      return {
        ...result,
        changes: result.changes.map(({ resource, revision }) => ({
          resourceId: resource.resourceId,
          revision,
          lifecycleState: resource.lifecycleState,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt,
          deletedAt: resource.deletedAt,
          event: resource.semanticEvent,
        })),
      };
    },
  };
  const names = [
    `device-a-${crypto.randomUUID()}`,
    `device-b-${crypto.randomUUID()}`,
  ];
  const repositories = names.map((databaseName) =>
    createIndexedDbTimelineRepository({ databaseName }),
  );
  for (let i = 0; i < 2; i++) {
    await repositories[i].initialize();
    await enableTimelineSync(names[i], transport);
  }
  return { bundle, scope, transport, names, repositories };
}

test('two devices converge through durable queue and deletion without an outbound pull loop', async () => {
  const {
    bundle,
    scope,
    transport,
    names,
    repositories: [a, b],
  } = await setup();
  try {
    await a.addEvent(event);
    await runTimelineSync(names[0], transport);
    await runTimelineSync(names[1], transport);
    const second = (await b.queryEvents({ order: 'occurredAt-asc', limit: 10 }))
      .events[0];
    assert.equal(second.concentrationMmolPerL, 5.4);
    await b.updateEvent({ ...second, concentrationMmolPerL: 6.8 });
    await runTimelineSync(names[1], transport);
    await runTimelineSync(names[0], transport);
    assert.equal((await a.getById(event.id)).concentrationMmolPerL, 6.8);
    await a.deleteEvent(event.id);
    await runTimelineSync(names[0], transport);
    await runTimelineSync(names[1], transport);
    assert.equal(
      (await b.queryEvents({ order: 'occurredAt-asc', limit: 10 })).events
        .length,
      0,
    );
    assert.equal(
      (await bundle.eventService.listResources({ scope, apiVersion: 'v1' }))
        .items.length,
      0,
    );
    assert.equal((await readTimelineSyncState(names[1])).pending, 0);
  } finally {
    a.close?.();
    b.close?.();
    await closeMedicalServiceBundle(bundle);
  }
});

test('ambiguous timeout retries stable mutation; stale offline edit stays conflicted', async () => {
  const {
    bundle,
    scope,
    transport,
    names,
    repositories: [a, b],
  } = await setup();
  try {
    await a.addEvent(event);
    let ambiguous = true;
    const flaky = {
      ...transport,
      push: async (request) => {
        const result = await transport.push(request);
        if (ambiguous) {
          ambiguous = false;
          throw new Error('timeout after commit');
        }
        return result;
      },
    };
    await runTimelineSync(names[0], flaky);
    assert.equal((await readTimelineSyncState(names[0])).pending, 1);
    await runTimelineSync(names[0], transport);
    await runTimelineSync(names[1], transport);
    assert.equal(
      (await a.queryEvents({ order: 'occurredAt-asc', limit: 10 })).events
        .length,
      1,
    );
    assert.equal((await readTimelineSyncState(names[0])).conflicts, 0);
    assert.equal(
      (await bundle.eventService.listResources({ scope, apiVersion: 'v1' }))
        .items.length,
      1,
    );
    const remote = (await b.queryEvents({ order: 'occurredAt-asc', limit: 10 }))
      .events[0];
    await b.updateEvent({ ...remote, concentrationMmolPerL: 6.8 });
    await a.updateEvent({ ...event, concentrationMmolPerL: 7.1 });
    await runTimelineSync(names[0], transport);
    const conflictTransport = {
      ...transport,
      push: async (request) => {
        try {
          return await transport.push(request);
        } catch (error) {
          return {
            mutationId: request.mutationId,
            status: 'conflict',
            code: error.code,
          };
        }
      },
    };
    await runTimelineSync(names[1], conflictTransport);
    assert.equal((await readTimelineSyncState(names[1])).conflicts, 1);
    assert.equal((await b.getById(remote.id)).concentrationMmolPerL, 6.8);
    const archive = await exportTimelineLocalData(names[1]);
    assert.ok(
      archive.stores.timeline_metadata.some((row) =>
        row.key.startsWith('sync-server:'),
      ),
    );
    assert.equal(
      (await bundle.eventService.listResources({ scope, apiVersion: 'v1' }))
        .items[0].semanticEvent.concentrationMmolPerL,
      7.1,
    );
  } finally {
    a.close?.();
    b.close?.();
    await closeMedicalServiceBundle(bundle);
  }
});

test('enable reconciles edits and deletions since adoption; unadopted history fails closed', async () => {
  const { bundle, scope, transport, repositories } = await setup();
  const name = `adopted-device-${crypto.randomUUID()}`;
  const repository = createIndexedDbTimelineRepository({ databaseName: name });
  try {
    await repository.initialize();
    await repository.addEvent(event);
    await assert.rejects(
      () => enableTimelineSync(name, transport),
      /SYNC_ADOPTION_REQUIRED/,
    );
    assert.equal((await readTimelineSyncState(name)).enabled, false);
    const original = await bundle.syncService.push(scope, {
      mutationId: 'adopted-create',
      operation: 'create',
      event,
    });
    const deletedEvent = {
      ...event,
      id: 'local-deleted',
      occurredAt: '2026-08-15T10:00:00.000Z',
    };
    await repository.addEvent(deletedEvent);
    const second = await bundle.syncService.push(scope, {
      mutationId: 'adopted-second',
      operation: 'create',
      event: deletedEvent,
    });
    const opened = await openTimelineIndexedDB({ databaseName: name });
    try {
      for (const [local, result] of [
        [event, original],
        [deletedEvent, second],
      ]) {
        await opened.connection.database.put(
          'timeline_adoption_acknowledgements',
          {
            localEventId: local.id,
            canonicalResourceId: result.resourceId,
            canonicalRevision: result.revision,
            adoptedAt: new Date().toISOString(),
            adoptionSessionId: 'adoption-test',
            storageSchemaVersion: 1,
          },
        );
      }
    } finally {
      opened.connection.close();
    }
    await repository.updateEvent({ ...event, concentrationMmolPerL: 6.8 });
    await repository.deleteEvent(deletedEvent.id);
    await enableTimelineSync(name, transport);
    assert.equal((await readTimelineSyncState(name)).pending, 2);
    await runTimelineSync(name, transport);
    const cloud = await bundle.eventService.listResources({
      scope,
      apiVersion: 'v1',
    });
    assert.equal(cloud.items.length, 1);
    assert.equal(cloud.items[0].semanticEvent.concentrationMmolPerL, 6.8);
    assert.equal(
      (await repository.queryEvents({ order: 'occurredAt-asc', limit: 10 }))
        .events.length,
      1,
    );
    await enableTimelineSync(name, transport);
    assert.equal((await readTimelineSyncState(name)).pending, 0);
  } finally {
    repository.close?.();
    repositories.forEach((r) => r.close?.());
    await closeMedicalServiceBundle(bundle);
  }
});
