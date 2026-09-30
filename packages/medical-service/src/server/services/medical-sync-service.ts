import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  createIdempotencyConflictError,
  InvalidRevisionTokenError,
  InvalidMedicalListCursorError,
  MedicalResourceNotFoundError,
  type MedicalEventResource,
} from '@diabetes-universe/medical-domain';
import {
  InvalidRevisionTokenError as InvalidPersistenceRevisionTokenError,
  MalformedRevisionTokenError,
  createMedicalSyncRepository,
  createMedicalEventRepository,
  createMedicalAuditRepository,
  createRevisionTokenService,
  createRequestFingerprint,
  type MedicalDatabase,
  type MedicalEnvironment,
  type SyncOutcome,
} from '@diabetes-universe/medical-persistence/server';
import type { SemanticTimelineEvent } from '@diabetes-universe/types';
import type { AuthorizationScope } from '../types/authorization-scope';
import { createMedicalEventService } from './medical-event-service';

export type SyncMutation = { readonly mutationId: string } & (
  | { readonly operation: 'create'; readonly event: SemanticTimelineEvent }
  | {
      readonly operation: 'update';
      readonly resourceId: string;
      readonly baseRevision: string;
      readonly event: SemanticTimelineEvent;
    }
  | {
      readonly operation: 'delete';
      readonly resourceId: string;
      readonly baseRevision: string;
    }
);

export function createMedicalSyncService(
  database: MedicalDatabase,
  environment: MedicalEnvironment,
) {
  const revisions = createRevisionTokenService(
    environment.revisionTokenSecret,
    { allowTestDefault: environment.databaseMode === 'pglite' },
  );
  function cursor(subjectId: string, sequence: string) {
    const payload = Buffer.from(
      JSON.stringify(['du-sync-v1', subjectId, sequence]),
    ).toString('base64url');
    return `${payload}.${createHmac('sha256', environment.listCursorSecret).update(payload).digest('base64url')}`;
  }
  function position(subjectId: string, token?: string) {
    if (!token) return '0';
    try {
      if (token.length > 1024) throw new Error();
      const [payload, mac, ...extra] = token.split('.');
      if (!payload || !mac || extra.length) throw new Error();
      const expected = createHmac('sha256', environment.listCursorSecret)
        .update(payload)
        .digest();
      const supplied = Buffer.from(mac, 'base64url');
      if (
        supplied.length !== expected.length ||
        !timingSafeEqual(supplied, expected)
      )
        throw new Error();
      const [version, subject, sequence] = JSON.parse(
        Buffer.from(payload, 'base64url').toString(),
      );
      if (
        version !== 'du-sync-v1' ||
        subject !== subjectId ||
        typeof sequence !== 'string' ||
        !/^(0|[1-9]\d{0,18})$/.test(sequence)
      )
        throw new Error();
      return sequence;
    } catch {
      throw new InvalidMedicalListCursorError('Sync cursor is invalid.');
    }
  }
  return {
    async push(
      scope: AuthorizationScope,
      mutation: SyncMutation,
    ): Promise<SyncOutcome> {
      const fingerprint = JSON.stringify([
        mutation.operation,
        mutation.operation === 'create' ? null : mutation.resourceId,
        mutation.operation === 'create' ? null : mutation.baseRevision,
        mutation.operation === 'delete'
          ? null
          : createRequestFingerprint(mutation.event),
      ]);
      return database.transaction(async (tx) => {
        const repository = createMedicalSyncRepository(tx);
        await repository.lock(
          scope.accountId,
          scope.subjectId,
          mutation.mutationId,
        );
        const existing = await repository.findOutcome(
          scope.accountId,
          scope.subjectId,
          mutation.mutationId,
        );
        if (existing) {
          if (existing.fingerprint !== fingerprint)
            throw createIdempotencyConflictError();
          return existing.outcome;
        }
        const events = createMedicalEventService(tx, environment);
        let outcome: SyncOutcome;
        if (mutation.operation === 'create') {
          const created = await events.createWithIdempotency({
            scope,
            apiVersion: 'sync-v1',
            operationScope: 'sync.create',
            idempotencyKey: mutation.mutationId,
            semanticEvent: mutation.event,
          });
          outcome = {
            resourceId: created.resource.resourceId,
            revision: created.etagToken,
            lifecycleState: 'active',
          };
        } else if (mutation.operation === 'update') {
          const updated = await events.updateWithRevision({
            scope,
            resourceId: mutation.resourceId,
            ifMatch: mutation.baseRevision,
            semanticEvent: mutation.event,
          });
          outcome = {
            resourceId: updated.resource.resourceId,
            revision: updated.etagToken,
            lifecycleState: 'active',
          };
        } else {
          // Authenticate the resource-bound revision even for already-deleted reconciliation.
          try {
            revisions.verifyAndParse(
              mutation.baseRevision,
              mutation.resourceId,
            );
          } catch (error) {
            if (
              error instanceof InvalidPersistenceRevisionTokenError ||
              error instanceof MalformedRevisionTokenError
            )
              throw new InvalidRevisionTokenError('Base revision is invalid.');
            throw error;
          }
          const resources = createMedicalEventRepository(tx);
          const resource = await resources.getByResourceId(
            scope.subjectId,
            mutation.resourceId,
            { includeDeletedForReplay: true },
          );
          if (!resource)
            throw new MedicalResourceNotFoundError(
              'Medical resource not found.',
            );
          if (resource.lifecycleState === 'active')
            await events.deleteWithRevision({
              scope,
              resourceId: mutation.resourceId,
              ifMatch: mutation.baseRevision,
            });
          const tombstone = await resources.getByResourceId(
            scope.subjectId,
            mutation.resourceId,
            { includeDeletedForReplay: true },
          );
          outcome = {
            resourceId: mutation.resourceId,
            revision: revisions.createToken(
              mutation.resourceId,
              tombstone!.revision,
            ),
            lifecycleState: 'deleted',
          };
        }
        await repository.saveOutcome(
          scope.accountId,
          scope.subjectId,
          mutation.mutationId,
          fingerprint,
          outcome,
        );
        return outcome;
      });
    },
    async pull(scope: AuthorizationScope, token?: string, limit = 50) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        throw new InvalidMedicalListCursorError('Invalid sync limit.');
      const after = position(scope.subjectId, token);
      const feed = await createMedicalSyncRepository(database).changes(
        scope.subjectId,
        after,
        limit + 1,
      );
      const page = feed.slice(0, limit);
      const resources = createMedicalEventRepository(database);
      const changes: { resource: MedicalEventResource; revision: string }[] =
        [];
      for (const item of page) {
        const resource = await resources.getByResourceId(
          scope.subjectId,
          item.resourceId,
          { includeDeletedForReplay: true },
        );
        if (!resource) throw new Error('SYNC_FEED_RESOURCE_UNAVAILABLE');
        changes.push({
          resource,
          revision: revisions.createToken(
            resource.resourceId,
            resource.revision,
          ),
        });
      }
      await createMedicalAuditRepository(database).insert({
        actorAccountId: scope.accountId,
        subjectId: scope.subjectId,
        action: 'medical_event.sync_pull',
        resourceType: 'medical_event',
        resourceId: null,
        outcome: 'success',
        correlationId: scope.correlationId,
        detail: { count: changes.length },
      });
      return {
        changes,
        nextCursor: cursor(scope.subjectId, page.at(-1)?.sequence ?? after),
        hasMore: feed.length > limit,
      };
    },
  };
}
