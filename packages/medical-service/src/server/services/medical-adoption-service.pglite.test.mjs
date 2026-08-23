import assert from 'node:assert/strict';
import test from 'node:test';

import { AdoptionNotEnabledError } from '@diabetes-universe/medical-domain';
import { resolveMedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  closeMedicalServiceBundle,
  createMedicalServiceBundle,
} from '../create-medical-service-bundle.ts';

const TEST_ENV = {
  NODE_ENV: 'test',
  MEDICAL_REVISION_TOKEN_SECRET: 'test-medical-revision-token-secret',
  MEDICAL_LIST_CURSOR_SECRET: 'test-medical-list-cursor-secret',
  MEDICAL_ADOPTION_ENABLED: '1',
};

function sampleEvent(localEventId = 'local-event-1') {
  return {
    occurredAt: '2026-08-14T10:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    context: 'fasting',
    id: localEventId,
    createdAt: '2026-08-14T09:00:00.000Z',
    updatedAt: '2026-08-14T09:00:00.000Z',
  };
}

test('adoptBatch creates mapping and replays same source identity', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-adopt-1');
  const scope = {
    accountId: 'acct-adopt-1',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-1',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-adopt-1',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
    eligibleCount: 1,
  });

  const item = {
    sourceNamespace: 'ns_test_store_1',
    localEventId: 'local-glucose-1',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-glucose-1'),
  };

  const first = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [item],
  });

  assert.equal(first.items.length, 1);
  assert.equal(first.items[0].status, 'adopted');

  const second = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [item],
  });

  assert.equal(second.items[0].status, 'already_adopted');
  assert.equal(second.items[0].resourceId, first.items[0].resourceId);

  await closeMedicalServiceBundle(bundle);
});

test('adoptBatch returns source conflict for changed fingerprint', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-adopt-conflict',
  );
  const scope = {
    accountId: 'acct-adopt-conflict',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-conflict',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-adopt-conflict',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const baseItem = {
    sourceNamespace: 'ns_conflict',
    localEventId: 'local-conflict-1',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-conflict-1'),
  };

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [baseItem],
  });

  const changed = {
    ...baseItem,
    event: {
      ...sampleEvent('local-conflict-1'),
      concentrationMmolPerL: 6.1,
    },
  };

  const result = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [changed],
  });

  assert.equal(result.items[0].status, 'failed');
  assert.equal(result.items[0].code, 'ADOPTION_SOURCE_CONFLICT');

  await closeMedicalServiceBundle(bundle);
});

test('adoption disabled when feature gate is off', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment({
      ...TEST_ENV,
      MEDICAL_ADOPTION_ENABLED: '0',
    }),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-adopt-disabled',
  );
  const scope = {
    accountId: 'acct-adopt-disabled',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-disabled',
  };

  assert.throws(
    () =>
      bundle.adoptionService.createOrResumeSession({
        scope,
        apiVersion: 'v1',
        clientAdoptionRunId: 'run-disabled',
        sourcePlatform: 'web',
        sourceAppVersion: '1.0.0',
        sourceSchemaMin: 1,
        sourceSchemaMax: 1,
      }),
    AdoptionNotEnabledError,
  );

  await closeMedicalServiceBundle(bundle);
});

test('already_adopted replay does not inflate session counters', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-replay-counter',
  );
  const scope = {
    accountId: 'acct-replay-counter',
    subjectId: relationship.subjectId,
    correlationId: 'corr-replay-counter',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-replay-counter',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const item = {
    sourceNamespace: 'ns_replay_counter',
    localEventId: 'local-replay-counter',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-replay-counter'),
  };

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [item],
  });

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [item],
  });

  const afterReplay = await bundle.adoptionService.getSession(
    scope,
    session.adoptionSessionId,
  );
  assert.equal(afterReplay.adoptedCount, 1);
  assert.equal(afterReplay.skippedCount, 0);
  assert.equal(afterReplay.failedCount, 0);

  await closeMedicalServiceBundle(bundle);
});

test('completeSession rejects unresolved failed items', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-incomplete');
  const scope = {
    accountId: 'acct-incomplete',
    subjectId: relationship.subjectId,
    correlationId: 'corr-incomplete',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-incomplete',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const conflictItem = {
    sourceNamespace: 'ns_incomplete',
    localEventId: 'local-incomplete-fail',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-incomplete-fail'),
  };

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [conflictItem],
  });

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [
      {
        ...conflictItem,
        event: {
          ...sampleEvent('local-incomplete-fail'),
          concentrationMmolPerL: 8.1,
        },
      },
    ],
  });

  await assert.rejects(
    () =>
      bundle.adoptionService.completeSession(scope, session.adoptionSessionId),
    (error) => error?.code === 'ADOPTION_SESSION_INCOMPLETE',
  );

  await closeMedicalServiceBundle(bundle);
});

test('terminal session rejects new batches', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship = await bundle.subjectService.provisionSelfSubject(
    'acct-adopt-terminal',
  );
  const scope = {
    accountId: 'acct-adopt-terminal',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-terminal',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-terminal',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  await bundle.adoptionService.completeSession(
    scope,
    session.adoptionSessionId,
  );

  const batch = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [
      {
        sourceNamespace: 'ns_terminal',
        localEventId: 'local-terminal-1',
        sourceSchemaVersion: 1,
        event: sampleEvent('local-terminal-1'),
      },
    ],
  });

  assert.equal(batch.items[0].status, 'failed');
  assert.equal(batch.items[0].code, 'ADOPTION_SESSION_CLOSED');

  await closeMedicalServiceBundle(bundle);
});

test('mixed batch partial success keeps adopted items', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-adopt-mixed');
  const scope = {
    accountId: 'acct-adopt-mixed',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-mixed',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-mixed',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const goodItem = {
    sourceNamespace: 'ns_mixed',
    localEventId: 'local-mixed-good',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-mixed-good'),
  };

  const conflictItem = {
    sourceNamespace: 'ns_mixed',
    localEventId: 'local-mixed-conflict',
    sourceSchemaVersion: 1,
    event: sampleEvent('local-mixed-conflict'),
  };

  await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [conflictItem],
  });

  const conflictingRetry = {
    ...conflictItem,
    event: {
      ...sampleEvent('local-mixed-conflict'),
      concentrationMmolPerL: 7.2,
    },
  };

  const result = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [goodItem, conflictingRetry],
  });

  assert.equal(result.items[0].status, 'adopted');
  assert.equal(result.items[1].status, 'failed');
  assert.equal(result.items[1].code, 'ADOPTION_SOURCE_CONFLICT');

  const replay = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: [goodItem],
  });
  assert.equal(replay.items[0].status, 'already_adopted');

  await closeMedicalServiceBundle(bundle);
});

test('large history adopts in bounded batches without duplicates on retry', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-adopt-load');
  const scope = {
    accountId: 'acct-adopt-load',
    subjectId: relationship.subjectId,
    correlationId: 'corr-adopt-load',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-load',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
    eligibleCount: 500,
  });

  const items = Array.from({ length: 500 }, (_, index) => ({
    sourceNamespace: 'ns_load',
    localEventId: `local-load-${index}`,
    sourceSchemaVersion: 1,
    event: sampleEvent(`local-load-${index}`),
  }));

  const batchSize = 25;
  const resourceIds = new Set();

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    assert.ok(batch.length <= 100);
    const result = await bundle.adoptionService.adoptBatch({
      scope,
      apiVersion: 'v1',
      adoptionSessionId: session.adoptionSessionId,
      items: batch,
    });
    for (const outcome of result.items) {
      if (outcome.status === 'adopted') {
        resourceIds.add(outcome.resourceId);
      }
    }
  }

  assert.equal(resourceIds.size, 500);

  const retryBatch = items.slice(0, batchSize);
  const retry = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: retryBatch,
  });
  assert.ok(retry.items.every((item) => item.status === 'already_adopted'));

  await closeMedicalServiceBundle(bundle);
});
