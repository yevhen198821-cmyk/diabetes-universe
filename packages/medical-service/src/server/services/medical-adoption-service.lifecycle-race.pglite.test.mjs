import assert from 'node:assert/strict';
import test from 'node:test';

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

function sampleEvent(localEventId) {
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

test('cancel during batch prevents new resource creation for later items', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-race-cancel');
  const scope = {
    accountId: 'acct-race-cancel',
    subjectId: relationship.subjectId,
    correlationId: 'corr-race-cancel',
  };

  const session = await bundle.adoptionService.createOrResumeSession({
    scope,
    apiVersion: 'v1',
    clientAdoptionRunId: 'run-race-cancel',
    sourcePlatform: 'web',
    sourceAppVersion: '1.0.0',
    sourceSchemaMin: 1,
    sourceSchemaMax: 1,
  });

  const items = Array.from({ length: 3 }, (_, index) => ({
    sourceNamespace: 'ns_race_cancel',
    localEventId: `local-race-cancel-${index}`,
    sourceSchemaVersion: 1,
    event: sampleEvent(`local-race-cancel-${index}`),
  }));

  await bundle.adoptionService.cancelSession(scope, session.adoptionSessionId);

  const result = await bundle.adoptionService.adoptBatch({
    scope,
    apiVersion: 'v1',
    adoptionSessionId: session.adoptionSessionId,
    items: items,
  });

  assert.ok(
    result.items.every(
      (item) =>
        item.status === 'failed' && item.code === 'ADOPTION_SESSION_CLOSED',
    ),
  );

  await closeMedicalServiceBundle(bundle);
});
