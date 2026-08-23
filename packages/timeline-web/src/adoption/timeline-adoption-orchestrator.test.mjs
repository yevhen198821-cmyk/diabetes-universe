import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryTimelineRepository } from '@diabetes-universe/timeline';

import { TimelineAdoptionOrchestrator } from './timeline-adoption-orchestrator.ts';
import { createTimelineAdoptionLocalStore } from './timeline-adoption-local-store.ts';
import { openTimelineIndexedDB } from '../persistence/indexeddb/timeline-indexeddb-open.ts';

function glucoseEvent(id, occurredAt) {
  return {
    id,
    occurredAt,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.2,
    context: 'fasting',
  };
}

async function seedEvent(repository, event) {
  await repository.initialize();
  await repository.addEvent(event);
}

function createMockTransport() {
  const adopted = new Map();
  let adoptionSessionId = 'session-mock-1';
  let completeCalls = 0;
  let batchCalls = 0;
  const sessionsByRun = new Map();

  return {
    getCompleteCalls: () => completeCalls,
    getBatchCalls: () => batchCalls,
    getAdoptedCount: () => adopted.size,
    transport: {
      async createOrResumeSession(input) {
        const existing = sessionsByRun.get(input.clientAdoptionRunId);
        if (existing) {
          adoptionSessionId = existing;
          return {
            session: {
              adoptionSessionId: existing,
              lifecycleState: 'open',
              clientAdoptionRunId: input.clientAdoptionRunId,
            },
          };
        }
        sessionsByRun.set(input.clientAdoptionRunId, adoptionSessionId);
        return {
          session: {
            adoptionSessionId,
            lifecycleState: 'open',
            clientAdoptionRunId: input.clientAdoptionRunId,
          },
        };
      },
      async adoptBatch(sessionId, items) {
        batchCalls += 1;
        const results = items.map((item) => {
          const existing = adopted.get(item.localEventId);
          if (existing) {
            return {
              localEventId: item.localEventId,
              status: 'already_adopted',
              resourceId: existing.resourceId,
              revision: existing.revision,
            };
          }

          const resourceId = `canonical-${item.localEventId}`;
          const revision = `rev-${item.localEventId}`;
          adopted.set(item.localEventId, { resourceId, revision });
          return {
            localEventId: item.localEventId,
            status: 'adopted',
            resourceId,
            revision,
            createdAt: new Date().toISOString(),
          };
        });
        return { items: results };
      },
      async completeSession(sessionId) {
        completeCalls += 1;
        return {
          session: {
            adoptionSessionId: sessionId,
            lifecycleState: 'completed',
          },
        };
      },
    },
  };
}

test('orchestrator adopts eligible events in bounded batches', async () => {
  const repository = new InMemoryTimelineRepository();
  const events = Array.from({ length: 60 }, (_, index) =>
    glucoseEvent(
      `evt-batch-${index}`,
      `2026-08-14T${String(10 + (index % 10)).padStart(2, '0')}:00:00.000Z`,
    ),
  );
  for (const event of events) {
    await seedEvent(repository, event);
  }

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  const orchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    batchSize: 25,
    clientAdoptionRunId: 'run-orchestrator-1',
  });

  const result = await orchestrator.run();

  assert.equal(result.status, 'completed');
  assert.equal(result.adoptedCount, 60);
  assert.equal(mock.getAdoptedCount(), 60);
  assert.equal(mock.getBatchCalls(), 3);
  assert.equal(mock.getCompleteCalls(), 1);
});

test('orchestrator restores durable run id after restart', async () => {
  const repository = new InMemoryTimelineRepository();
  await seedEvent(
    repository,
    glucoseEvent('evt-resume-run', '2026-08-14T10:00:00.000Z'),
  );

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  const first = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    clientAdoptionRunId: 'run-durable-1',
  });

  await first.run();

  const second = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
  });

  const classification = await second.classifyLocalEvents();
  const resumed = classification.find(
    (item) => item.localEventId === 'evt-resume-run',
  );
  assert.equal(resumed?.classification, 'already_adopted');

  const checkpoint = await localStore.getResumableSessionCheckpoint();
  assert.equal(checkpoint, null);
});

test('orchestrator retries crash-before-ack without duplicate canonical resources', async () => {
  const repository = new InMemoryTimelineRepository();
  await seedEvent(
    repository,
    glucoseEvent('evt-crash-1', '2026-08-14T10:00:00.000Z'),
  );

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  const orchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore: {
      ...localStore,
      saveAcknowledgement: async () => {
        // Simulate crash before local acknowledgement persistence.
      },
    },
    transport: mock.transport,
    clientAdoptionRunId: 'run-crash-1',
  });

  const firstResult = await orchestrator.run();
  assert.equal(firstResult.status, 'incomplete');
  assert.equal(mock.getCompleteCalls(), 0);
  assert.equal(mock.getAdoptedCount(), 1);

  const retryOrchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
  });

  const retryResult = await retryOrchestrator.run();
  assert.equal(retryResult.status, 'completed');
  assert.equal(retryResult.adoptedCount, 0);
  assert.equal(retryResult.skippedCount, 1);
  assert.equal(mock.getAdoptedCount(), 1);
  assert.equal(mock.getCompleteCalls(), 1);
});

test('orchestrator does not complete when batch item fails', async () => {
  const repository = new InMemoryTimelineRepository();
  await seedEvent(
    repository,
    glucoseEvent('evt-fail-1', '2026-08-14T10:00:00.000Z'),
  );

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  const orchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: {
      ...mock.transport,
      async adoptBatch(sessionId, items) {
        return {
          items: items.map((item) => ({
            localEventId: item.localEventId,
            status: 'failed',
            code: 'ADOPTION_ITEM_INVALID',
            message: 'simulated failure',
          })),
        };
      },
    },
    clientAdoptionRunId: 'run-fail-1',
  });

  const result = await orchestrator.run();
  assert.equal(result.status, 'incomplete');
  assert.equal(result.failedCount, 1);
  assert.equal(mock.getCompleteCalls(), 0);

  const checkpoint = await localStore.getResumableSessionCheckpoint();
  assert.equal(checkpoint?.lifecycle, 'failed');
});

test('terminal checkpoint does not resume until forceNewRun', async () => {
  const repository = new InMemoryTimelineRepository();
  await seedEvent(
    repository,
    glucoseEvent('evt-terminal', '2026-08-14T11:00:00.000Z'),
  );

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  await localStore.saveSessionCheckpoint({
    clientAdoptionRunId: 'run-terminal-old',
    adoptionSessionId: 'session-terminal-old',
    lifecycle: 'completed',
    checkpoint: { eligibleCount: 1, adoptedCount: 1, failedCount: 0 },
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
    storageSchemaVersion: 1,
  });

  const orchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    forceNewRun: true,
    clientAdoptionRunId: 'run-terminal-new',
  });

  const result = await orchestrator.run();
  assert.equal(result.status, 'completed');
  assert.equal(result.adoptedCount, 1);
});

test('indexeddb local store persists source namespace and acknowledgements', async () => {
  const databaseName = `timeline-adoption-local-store-${Date.now()}`;
  const connection = await openTimelineIndexedDB({ databaseName });
  const localStore = createTimelineAdoptionLocalStore(
    connection.connection.database,
  );

  const namespace = await localStore.ensureSourceNamespace(
    () => 'ns_test_store',
  );
  assert.match(namespace, /^ns_/);

  await localStore.saveSessionCheckpoint({
    clientAdoptionRunId: 'run-ack-test',
    adoptionSessionId: 'session-ack-test',
    lifecycle: 'open',
    checkpoint: { eligibleCount: 1 },
    createdAt: '2026-08-14T08:00:00.000Z',
    updatedAt: '2026-08-14T08:00:00.000Z',
    storageSchemaVersion: 1,
  });

  await localStore.saveSessionCheckpoint({
    clientAdoptionRunId: 'run-ack-test',
    adoptionSessionId: 'session-ack-test',
    lifecycle: 'open',
    checkpoint: { eligibleCount: 1, adoptedCount: 1 },
    createdAt: '2026-08-14T08:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
    storageSchemaVersion: 1,
  });

  const checkpoint = await localStore.getSessionByRunId('run-ack-test');
  assert.equal(checkpoint?.createdAt, '2026-08-14T08:00:00.000Z');

  await localStore.saveAcknowledgement({
    localEventId: 'evt-ack-1',
    canonicalResourceId: 'resource-ack-1',
    canonicalRevision: 'rev-ack-1',
    adoptedAt: '2026-08-14T10:00:00.000Z',
    adoptionSessionId: 'session-ack-1',
    storageSchemaVersion: 1,
  });

  const reopened = await openTimelineIndexedDB({ databaseName });
  const reopenedStore = createTimelineAdoptionLocalStore(
    reopened.connection.database,
  );
  assert.equal(await reopenedStore.hasAcknowledgement('evt-ack-1'), true);
  const resumable = await reopenedStore.getResumableSessionCheckpoint();
  assert.equal(resumable?.clientAdoptionRunId, 'run-ack-test');
});

function createInMemoryLocalStore() {
  let sourceNamespace = '';
  const acknowledgements = new Map();
  const sessions = new Map();

  return {
    async ensureSourceNamespace(createNamespace) {
      if (!sourceNamespace) {
        sourceNamespace = createNamespace();
      }
      return sourceNamespace;
    },
    async hasAcknowledgement(localEventId) {
      return acknowledgements.has(localEventId);
    },
    async saveAcknowledgement(acknowledgement) {
      acknowledgements.set(acknowledgement.localEventId, acknowledgement);
    },
    async saveSessionCheckpoint(session) {
      const existing = sessions.get(session.clientAdoptionRunId);
      sessions.set(session.clientAdoptionRunId, {
        ...session,
        createdAt: existing?.createdAt ?? session.createdAt,
      });
    },
    async getSessionByRunId(clientAdoptionRunId) {
      return sessions.get(clientAdoptionRunId) ?? null;
    },
    async getResumableSessionCheckpoint() {
      const resumable = [...sessions.values()]
        .filter(
          (session) =>
            session.lifecycle === 'open' || session.lifecycle === 'failed',
        )
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
      return resumable[0] ?? null;
    },
  };
}
