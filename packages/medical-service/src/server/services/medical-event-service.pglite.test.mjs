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
};

function sampleEvent(occurredAt = '2026-08-14T10:00:00.000Z') {
  return {
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    kind: 'glucose',
    concentrationMmolPerL: 5.4,
    context: 'fasting',
  };
}

for (const lifecycle of ['updated', 'deleted']) {
  test(`create replay preserves the original outcome after resource is ${lifecycle}`, async () => {
    const bundle = await createMedicalServiceBundle(
      resolveMedicalEnvironment(TEST_ENV),
    );
    try {
      const accountId = `acct-replay-${lifecycle}`;
      const relationship =
        await bundle.subjectService.provisionSelfSubject(accountId);
      const scope = {
        accountId,
        subjectId: relationship.subjectId,
        correlationId: 'replay',
      };
      const input = {
        scope,
        apiVersion: 'v1',
        operationScope: 'medical_event.create',
        idempotencyKey: 'original-create',
        semanticEvent: sampleEvent(),
      };
      const original = await bundle.eventService.createWithIdempotency(input);
      const changed = await bundle.eventService.updateWithRevision({
        scope,
        resourceId: original.resource.resourceId,
        ifMatch: original.etagToken,
        semanticEvent: {
          ...sampleEvent('2026-08-15T11:00:00.000Z'),
          concentrationMmolPerL: 6.8,
          provenance: { label: 'changed' },
        },
      });
      if (lifecycle === 'deleted') {
        await bundle.eventService.deleteWithRevision({
          scope,
          resourceId: changed.resource.resourceId,
          ifMatch: changed.etagToken,
        });
      }
      const replay = await bundle.eventService.createWithIdempotency(input);
      assert.equal(replay.replayed, true);
      assert.equal(replay.httpStatus, original.httpStatus);
      assert.equal(replay.etagToken, original.etagToken);
      assert.deepEqual(replay.resource, original.resource);
      if (lifecycle === 'deleted') {
        await assert.rejects(
          () =>
            bundle.eventService.getResource(
              scope,
              original.resource.resourceId,
            ),
          { code: 'RESOURCE_NOT_FOUND' },
        );
        assert.equal(
          (await bundle.eventService.listResources({ scope, apiVersion: 'v1' }))
            .items.length,
          0,
        );
      } else {
        assert.deepEqual(
          (
            await bundle.eventService.getResource(
              scope,
              original.resource.resourceId,
            )
          ).resource,
          changed.resource,
        );
        await assert.rejects(
          () =>
            bundle.eventService.updateWithRevision({
              scope,
              resourceId: changed.resource.resourceId,
              ifMatch: replay.etagToken,
              semanticEvent: sampleEvent(),
            }),
          { code: 'REVISION_CONFLICT' },
        );
      }
      await assert.rejects(
        () =>
          bundle.eventService.createWithIdempotency({
            ...input,
            semanticEvent: { ...sampleEvent(), concentrationMmolPerL: 7.1 },
          }),
        { code: 'IDEMPOTENCY_CONFLICT' },
      );
    } finally {
      await closeMedicalServiceBundle(bundle);
    }
  });
}

test('getResource returns active resource for resolved subject', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-get');
  const scope = {
    accountId: 'acct-get',
    subjectId: relationship.subjectId,
    correlationId: 'corr-get',
  };

  const created = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'get-key-1',
    semanticEvent: sampleEvent(),
  });

  const fetched = await bundle.eventService.getResource(
    scope,
    created.resource.resourceId,
  );

  assert.equal(fetched.resource.resourceId, created.resource.resourceId);
  assert.match(fetched.etagToken, /^v1\./);

  await closeMedicalServiceBundle(bundle);
});

test('getResource uses non-enumerating not-found for another subject', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const owner = await bundle.subjectService.provisionSelfSubject('acct-owner');
  const other = await bundle.subjectService.provisionSelfSubject('acct-other');

  const created = await bundle.eventService.createWithIdempotency({
    scope: {
      accountId: 'acct-owner',
      subjectId: owner.subjectId,
      correlationId: 'corr-owner',
    },
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'owner-key',
    semanticEvent: sampleEvent(),
  });

  await assert.rejects(
    () =>
      bundle.eventService.getResource(
        {
          accountId: 'acct-other',
          subjectId: other.subjectId,
          correlationId: 'corr-other',
        },
        created.resource.resourceId,
      ),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'RESOURCE_NOT_FOUND',
  );

  await closeMedicalServiceBundle(bundle);
});

test('listResources paginates with opaque cursor and no duplicates', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-list');
  const scope = {
    accountId: 'acct-list',
    subjectId: relationship.subjectId,
    correlationId: 'corr-list',
  };

  const ids = [];
  for (let index = 0; index < 3; index += 1) {
    const created = await bundle.eventService.createWithIdempotency({
      scope,
      apiVersion: 'v1',
      operationScope: 'medical_event.create',
      idempotencyKey: `list-key-${index}`,
      semanticEvent: sampleEvent(`2026-08-14T1${index}:00:00.000Z`),
    });
    ids.push(created.resource.resourceId);
  }

  const pageOne = await bundle.eventService.listResources({
    scope,
    apiVersion: 'v1',
    limit: 2,
  });

  assert.equal(pageOne.items.length, 2);
  assert.equal(pageOne.hasMore, true);
  assert.ok(pageOne.nextCursor);

  const pageTwo = await bundle.eventService.listResources({
    scope,
    apiVersion: 'v1',
    limit: 2,
    cursor: pageOne.nextCursor ?? undefined,
  });

  assert.equal(pageTwo.items.length, 1);
  assert.equal(pageTwo.hasMore, false);

  const combined = [...pageOne.items, ...pageTwo.items].map(
    (item) => item.resourceId,
  );
  assert.deepEqual(new Set(combined).size, combined.length);
  assert.deepEqual(new Set(combined), new Set(ids));

  await closeMedicalServiceBundle(bundle);
});

test('updateWithRevision rejects stale revision', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-update');
  const scope = {
    accountId: 'acct-update',
    subjectId: relationship.subjectId,
    correlationId: 'corr-update',
  };

  const created = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'update-key',
    semanticEvent: sampleEvent(),
  });

  await bundle.eventService.updateWithRevision({
    scope,
    resourceId: created.resource.resourceId,
    ifMatch: created.etagToken,
    semanticEvent: sampleEvent('2026-08-14T11:00:00.000Z'),
  });

  await assert.rejects(
    () =>
      bundle.eventService.updateWithRevision({
        scope,
        resourceId: created.resource.resourceId,
        ifMatch: created.etagToken,
        semanticEvent: sampleEvent('2026-08-14T12:00:00.000Z'),
      }),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'REVISION_CONFLICT',
  );

  await closeMedicalServiceBundle(bundle);
});

test('deleteWithRevision soft deletes resource', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-delete');
  const scope = {
    accountId: 'acct-delete',
    subjectId: relationship.subjectId,
    correlationId: 'corr-delete',
  };

  const created = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'delete-key',
    semanticEvent: sampleEvent(),
  });

  await bundle.eventService.deleteWithRevision({
    scope,
    resourceId: created.resource.resourceId,
    ifMatch: created.etagToken,
  });

  await assert.rejects(
    () => bundle.eventService.getResource(scope, created.resource.resourceId),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'RESOURCE_NOT_FOUND',
  );

  await closeMedicalServiceBundle(bundle);
});

test('createWithIdempotency replays same key and fingerprint without duplicate resource', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  const relationship =
    await bundle.subjectService.provisionSelfSubject('acct-idem');

  const scope = {
    accountId: 'acct-idem',
    subjectId: relationship.subjectId,
    correlationId: 'corr-1',
  };

  const first = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'idem-key-1',
    semanticEvent: sampleEvent(),
  });

  const second = await bundle.eventService.createWithIdempotency({
    scope,
    apiVersion: 'v1',
    operationScope: 'medical_event.create',
    idempotencyKey: 'idem-key-1',
    semanticEvent: sampleEvent(),
  });

  assert.equal(first.replayed, false);
  assert.equal(second.replayed, true);
  assert.equal(first.resource.resourceId, second.resource.resourceId);

  await closeMedicalServiceBundle(bundle);
});

test('createWithIdempotency rejects same key with different fingerprint', async () => {
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
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
    semanticEvent: sampleEvent(),
  });

  await assert.rejects(
    () =>
      bundle.eventService.createWithIdempotency({
        scope,
        apiVersion: 'v1',
        operationScope: 'medical_event.create',
        idempotencyKey: 'idem-key-conflict',
        semanticEvent: {
          ...sampleEvent(),
          concentrationMmolPerL: 7.1,
        },
      }),
    (error) =>
      error instanceof Error &&
      'code' in error &&
      error.code === 'IDEMPOTENCY_CONFLICT',
  );

  await closeMedicalServiceBundle(bundle);
});

test('read audit contains no clinical payload and audit failure prevents disclosure', async () => {
  const { sql } = await import('drizzle-orm');
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  try {
    const self =
      await bundle.subjectService.provisionSelfSubject('audit-owner');
    const scope = {
      accountId: 'audit-owner',
      subjectId: self.subjectId,
      correlationId: 'audit-check',
    };
    const created = await bundle.eventService.createWithIdempotency({
      scope,
      apiVersion: 'v1',
      operationScope: 'medical_event.create',
      idempotencyKey: 'audit-create',
      semanticEvent: sampleEvent(),
    });
    await bundle.eventService.getResource(scope, created.resource.resourceId);
    await bundle.eventService.listResources({ scope, apiVersion: 'v1' });
    const result = await bundle.database.execute(
      sql`SELECT action, detail FROM medical.medical_audit_events WHERE action IN ('medical_event.read','medical_event.list')`,
    );
    const rows = result.rows ?? result;
    assert.deepEqual(rows.map((row) => row.action).sort(), [
      'medical_event.list',
      'medical_event.read',
    ]);
    assert.doesNotMatch(JSON.stringify(rows), /concentrationMmolPerL|fasting/);
    await bundle.database.execute(
      sql`ALTER TABLE medical.medical_audit_events RENAME TO unavailable_audit`,
    );
    await assert.rejects(() =>
      bundle.eventService.getResource(scope, created.resource.resourceId),
    );
    await assert.rejects(() =>
      bundle.eventService.listResources({ scope, apiVersion: 'v1' }),
    );
  } finally {
    await closeMedicalServiceBundle(bundle);
  }
});

test('legacy incomplete fingerprints fail closed without creating a second resource', async () => {
  const { sql } = await import('drizzle-orm');
  const bundle = await createMedicalServiceBundle(
    resolveMedicalEnvironment(TEST_ENV),
  );
  try {
    const self =
      await bundle.subjectService.provisionSelfSubject('legacy-owner');
    const scope = {
      accountId: 'legacy-owner',
      subjectId: self.subjectId,
      correlationId: 'legacy-check',
    };
    const input = {
      scope,
      apiVersion: 'v1',
      operationScope: 'medical_event.create',
      idempotencyKey: 'legacy-create',
      semanticEvent: sampleEvent(),
    };
    await bundle.eventService.createWithIdempotency(input);
    await bundle.database.execute(
      sql`UPDATE medical.medical_idempotency_records SET request_fingerprint='legacy-incomplete-hash'`,
    );
    await assert.rejects(
      () => bundle.eventService.createWithIdempotency(input),
      { code: 'IDEMPOTENCY_CONFLICT' },
    );
    assert.equal(
      (await bundle.eventService.listResources({ scope, apiVersion: 'v1' }))
        .items.length,
      1,
    );
  } finally {
    await closeMedicalServiceBundle(bundle);
  }
});
