import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveMedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createMedicalServiceBundle,
  closeMedicalServiceBundle,
} from '../create-medical-service-bundle.ts';

test('createWithIdempotency replays same key and fingerprint without duplicate resource', async () => {
  const environment = resolveMedicalEnvironment({
    NODE_ENV: 'test',
    MEDICAL_REVISION_TOKEN_SECRET: 'test-secret',
  });

  const bundle = await createMedicalServiceBundle(environment);
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-idem');

  const scope = {
    accountId: 'acct-idem',
    subjectId: relationship.subjectId,
    correlationId: 'corr-1',
  };

  const event = {
    occurredAt: '2026-08-14T10:00:00.000Z',
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    context: 'fasting',
  };

  const first = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'idem-key-1',
    semanticEvent: event,
  });

  const second = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'idem-key-1',
    semanticEvent: event,
  });

  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(first.resource.resourceId, second.resource.resourceId);

  await closeMedicalServiceBundle(bundle);
});

test('createWithIdempotency rejects same key with different fingerprint', async () => {
  const environment = resolveMedicalEnvironment({
    NODE_ENV: 'test',
    MEDICAL_REVISION_TOKEN_SECRET: 'test-secret',
  });

  const bundle = await createMedicalServiceBundle(environment);
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-conflict');

  const scope = {
    accountId: 'acct-conflict',
    subjectId: relationship.subjectId,
    correlationId: 'corr-2',
  };

  await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'idem-key-conflict',
    semanticEvent: {
      occurredAt: '2026-08-14T10:00:00.000Z',
      schemaVersion: 1,
      source: 'manual',
      kind: 'glucose',
      concentrationMmolPerL: 5.4,
      context: 'fasting',
    },
  });

  await assert.rejects(
    () =>
      bundle.eventService.createWithIdempotency({
        scope,
        apiVersion: 'v1',
        operationScope: 'medical_event.create',
        idempotencyKey: 'idem-key-conflict',
        semanticEvent: {
          occurredAt: '2026-08-14T10:00:00.000Z',
          schemaVersion: 1,
          source: 'manual',
          kind: 'glucose',
          concentrationMmolPerL: 7.1,
          context: 'fasting',
        },
      }),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'IDEMPOTENCY_CONFLICT',
  );

  await closeMedicalServiceBundle(bundle);
});
