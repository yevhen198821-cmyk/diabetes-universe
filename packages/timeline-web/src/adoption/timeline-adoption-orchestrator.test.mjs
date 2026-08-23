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
  let batchCalls = 0;

  return {
    batchCalls,
    transport: {
      async createOrResumeSession(input) {
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
        return {
          session: {
            adoptionSessionId: sessionId,
            lifecycleState: 'completed',
          },
        };
      },
    },
    getBatchCalls: () => batchCalls,
    getAdoptedCount: () => adopted.size,
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

  assert.equal(result.adoptedCount, 60);
  assert.equal(mock.getAdoptedCount(), 60);
  assert.ok(mock.getBatchCalls() >= 3);
  assert.ok(mock.getBatchCalls() <= 3);
});

test('orchestrator retries without duplicate canonical resources after crash before ack', async () => {
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

  await orchestrator.run();
  assert.equal(mock.getAdoptedCount(), 1);

  const retryOrchestrator = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    clientAdoptionRunId: 'run-crash-retry',
  });

  const retryResult = await retryOrchestrator.run();
  assert.equal(retryResult.adoptedCount, 0);
  assert.equal(retryResult.skippedCount, 1);
  assert.equal(mock.getAdoptedCount(), 1);
});

test('orchestrator skips acknowledged events on resume', async () => {
  const repository = new InMemoryTimelineRepository();
  await seedEvent(
    repository,
    glucoseEvent('evt-resume-1', '2026-08-14T10:00:00.000Z'),
  );

  const mock = createMockTransport();
  const localStore = createInMemoryLocalStore();

  const first = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    clientAdoptionRunId: 'run-resume-1',
  });
  await first.run();

  const second = new TimelineAdoptionOrchestrator({
    repository,
    localStore,
    transport: mock.transport,
    clientAdoptionRunId: 'run-resume-2',
  });
  const classification = await second.classifyLocalEvents();
  const resumed = classification.find(
    (item) => item.localEventId === 'evt-resume-1',
  );
  assert.equal(resumed?.classification, 'already_adopted');
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

  const namespaceAgain = await localStore.ensureSourceNamespace(
    () => 'ns_other',
  );
  assert.equal(namespaceAgain, namespace);

  await localStore.saveAcknowledgement({
    localEventId: 'evt-ack-1',
    canonicalResourceId: 'resource-ack-1',
    canonicalRevision: 'rev-ack-1',
    adoptedAt: '2026-08-14T10:00:00.000Z',
    adoptionSessionId: 'session-ack-1',
    storageSchemaVersion: 1,
  });

  assert.equal(await localStore.hasAcknowledgement('evt-ack-1'), true);

  const reopened = await openTimelineIndexedDB({ databaseName });
  const reopenedStore = createTimelineAdoptionLocalStore(
    reopened.connection.database,
  );
  assert.equal(await reopenedStore.hasAcknowledgement('evt-ack-1'), true);
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
      sessions.set(session.clientAdoptionRunId, session);
    },
    async getSessionByRunId(clientAdoptionRunId) {
      return sessions.get(clientAdoptionRunId) ?? null;
    },
  };
}
