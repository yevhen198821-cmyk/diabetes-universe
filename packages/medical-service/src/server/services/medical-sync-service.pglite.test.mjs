import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveMedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createMedicalServiceBundle,
  closeMedicalServiceBundle,
} from '../create-medical-service-bundle.ts';

const env = resolveMedicalEnvironment({ NODE_ENV: 'test' });
const event = {
  kind: 'glucose',
  source: 'manual',
  schemaVersion: 1,
  occurredAt: '2026-08-14T10:00:00.000Z',
  concentrationMmolPerL: 5.4,
};

test('sync converges create/update/delete, replays each mutation and rejects stale intent', async () => {
  const bundle = await createMedicalServiceBundle(env);
  try {
    const self = await bundle.subjectService.provisionSelfSubject('sync-owner');
    const scope = {
      accountId: 'sync-owner',
      subjectId: self.subjectId,
      correlationId: 'sync-test',
    };
    const create = {
      mutationId: 'mutation-create',
      operation: 'create',
      event,
    };
    const original = await bundle.syncService.push(scope, create);
    assert.deepEqual(await bundle.syncService.push(scope, create), original);
    const first = await bundle.syncService.pull(scope);
    assert.equal(first.changes.length, 1);
    const update = {
      mutationId: 'mutation-update',
      operation: 'update',
      resourceId: original.resourceId,
      baseRevision: original.revision,
      event: { ...event, concentrationMmolPerL: 6.8 },
    };
    const updated = await bundle.syncService.push(scope, update);
    assert.deepEqual(await bundle.syncService.push(scope, update), updated);
    await assert.rejects(
      () => bundle.syncService.push(scope, { ...update, mutationId: 'stale' }),
      { code: 'REVISION_CONFLICT' },
    );
    await assert.rejects(
      () =>
        bundle.syncService.push(scope, {
          ...update,
          event: { ...event, concentrationMmolPerL: 7.1 },
        }),
      { code: 'IDEMPOTENCY_CONFLICT' },
    );
    const del = {
      mutationId: 'mutation-delete',
      operation: 'delete',
      resourceId: original.resourceId,
      baseRevision: updated.revision,
    };
    const deleted = await bundle.syncService.push(scope, del);
    assert.equal(deleted.lifecycleState, 'deleted');
    assert.deepEqual(await bundle.syncService.push(scope, del), deleted);
    assert.deepEqual(
      await bundle.syncService.push(scope, {
        ...del,
        mutationId: 'other-delete',
      }),
      deleted,
    );
    assert.deepEqual(await bundle.syncService.push(scope, create), original);
    const remaining = await bundle.syncService.pull(scope, first.nextCursor, 1);
    assert.equal(remaining.changes[0].resource.lifecycleState, 'deleted');
    assert.equal(remaining.hasMore, true);
    const last = await bundle.syncService.pull(scope, remaining.nextCursor, 1);
    assert.equal(last.hasMore, false);
    assert.equal(last.changes[0].resource.lifecycleState, 'deleted');
    assert.equal(
      (await bundle.syncService.pull(scope, last.nextCursor)).changes.length,
      0,
    );
    const other =
      await bundle.subjectService.provisionSelfSubject('sync-other');
    await assert.rejects(
      () =>
        bundle.syncService.pull(
          { ...scope, subjectId: other.subjectId },
          first.nextCursor,
        ),
      { code: 'INVALID_CURSOR' },
    );
    await assert.rejects(
      () => bundle.syncService.pull(scope, first.nextCursor + 'x'),
      { code: 'INVALID_CURSOR' },
    );
  } finally {
    await closeMedicalServiceBundle(bundle);
  }
});
