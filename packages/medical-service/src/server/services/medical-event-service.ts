import { sql } from 'drizzle-orm';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  createIdempotencyConflictError,
  InvalidMedicalListCursorError,
  InvalidRevisionPreconditionError,
  InvalidRevisionTokenError,
  type IdempotencyScope,
  type MedicalEventResource,
  type MedicalEventResourcePatch,
  MedicalResourceNotFoundError,
  MedicalRevisionConflictError,
} from '@diabetes-universe/medical-domain';
import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createMedicalAuditRepository,
  createMedicalEventRepository,
  createMedicalIdempotencyRepository,
  createMedicalOutboxRepository,
  createListCursorTokenService,
  createRequestFingerprint,
  createRevisionTokenService,
  InvalidListCursorError,
  InvalidRevisionTokenError as InvalidPersistenceRevisionTokenError,
  MalformedListCursorError,
  MalformedRevisionTokenError,
  type MedicalDatabase,
  type ListCursorScope,
  type RevisionTokenService,
} from '@diabetes-universe/medical-persistence/server';

import type { AuthorizationScope } from '../types/authorization-scope';

export interface CreateMedicalEventInput {
  readonly scope: AuthorizationScope;
  readonly apiVersion: string;
  readonly operationScope: string;
  readonly idempotencyKey: string;
  readonly semanticEvent: SemanticTimelineEvent;
}

export interface CreateMedicalEventResult {
  readonly resource: MedicalEventResource;
  readonly etagToken: string;
  readonly httpStatus: number;
  readonly replayed: boolean;
}

export interface GetMedicalEventResult {
  readonly resource: MedicalEventResource;
  readonly etagToken: string;
}

export interface ListMedicalEventsInput {
  readonly scope: AuthorizationScope;
  readonly apiVersion: string;
  readonly limit?: number;
  readonly cursor?: string;
}

export interface ListMedicalEventsResult {
  readonly items: readonly MedicalEventResource[];
  readonly etagTokens: readonly string[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

export interface UpdateMedicalEventInput {
  readonly scope: AuthorizationScope;
  readonly resourceId: string;
  readonly ifMatch: string;
  readonly semanticEvent: SemanticTimelineEvent;
}

export interface UpdateMedicalEventResult {
  readonly resource: MedicalEventResource;
  readonly etagToken: string;
}

export interface DeleteMedicalEventInput {
  readonly scope: AuthorizationScope;
  readonly resourceId: string;
  readonly ifMatch: string;
}

export interface MedicalEventService {
  createWithIdempotency(
    input: CreateMedicalEventInput,
  ): Promise<CreateMedicalEventResult>;
  getResource(
    scope: AuthorizationScope,
    resourceId: string,
  ): Promise<GetMedicalEventResult>;
  listResources(
    input: ListMedicalEventsInput,
  ): Promise<ListMedicalEventsResult>;
  updateWithRevision(
    input: UpdateMedicalEventInput,
  ): Promise<UpdateMedicalEventResult>;
  deleteWithRevision(input: DeleteMedicalEventInput): Promise<void>;
}

const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;

export function createMedicalEventService(
  database: MedicalDatabase,
  environment: MedicalEnvironment,
): MedicalEventService {
  const allowTestDefault = environment.databaseMode === 'pglite';
  const revisionTokens = createRevisionTokenService(
    environment.revisionTokenSecret,
    { allowTestDefault },
  );
  const listCursorTokens = createListCursorTokenService(
    environment.listCursorSecret,
    { allowTestDefault },
  );
  const eventRepository = createMedicalEventRepository(database);

  function toEtag(resource: MedicalEventResource): string {
    return revisionTokens.createToken(resource.resourceId, resource.revision);
  }

  function parseIfMatch(
    resourceId: string,
    ifMatch: string | undefined,
  ): ReturnType<RevisionTokenService['verifyAndParse']> {
    if (!ifMatch?.trim()) {
      throw new InvalidRevisionPreconditionError(
        'If-Match header is required.',
      );
    }

    try {
      return revisionTokens.verifyAndParse(ifMatch.trim(), resourceId);
    } catch (error) {
      if (
        error instanceof MalformedRevisionTokenError ||
        error instanceof InvalidPersistenceRevisionTokenError
      ) {
        throw new InvalidRevisionTokenError(
          'If-Match revision token is invalid.',
        );
      }
      throw error;
    }
  }

  return {
    async createWithIdempotency(input) {
      const fingerprint = createRequestFingerprint(input.semanticEvent);
      const idempotencyScope: IdempotencyScope = {
        accountId: input.scope.accountId,
        subjectId: input.scope.subjectId,
        apiVersion: input.apiVersion,
        operationScope: input.operationScope,
        idempotencyKey: input.idempotencyKey,
      };

      const expiresAt = new Date(
        Date.now() + environment.idempotencyRetentionHours * 60 * 60 * 1000,
      );

      return database.transaction(async (tx) => {
        const lockKey = [
          idempotencyScope.accountId,
          idempotencyScope.subjectId,
          idempotencyScope.apiVersion,
          idempotencyScope.operationScope,
          idempotencyScope.idempotencyKey,
        ].join('|');

        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
        );

        const idempotencyRepository = createMedicalIdempotencyRepository(tx);
        const txEventRepository = createMedicalEventRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const outboxRepository = createMedicalOutboxRepository(tx);

        const existing = await idempotencyRepository.findCommittedOutcome(
          idempotencyScope,
          fingerprint,
        );

        if (existing) {
          const resource = await txEventRepository.getByResourceId(
            input.scope.subjectId,
            existing.resultResourceId,
          );

          if (!resource) {
            throw new Error('Idempotency record references missing resource.');
          }

          return {
            resource,
            etagToken: existing.resultEtagToken,
            httpStatus: existing.storedHttpStatus,
            replayed: true,
          };
        }

        await idempotencyRepository.assertNoConflictingOutcome(
          idempotencyScope,
          fingerprint,
        );

        const resource = await txEventRepository.insert(input.scope.subjectId, {
          semanticEvent: input.semanticEvent,
          createdByAccountId: input.scope.accountId,
        });

        const etagToken = revisionTokens.createToken(
          resource.resourceId,
          resource.revision,
        );

        await auditRepository.insert({
          actorAccountId: input.scope.accountId,
          subjectId: input.scope.subjectId,
          action: 'medical_event.create',
          resourceType: 'medical_event',
          resourceId: resource.resourceId,
          outcome: 'success',
          correlationId: input.scope.correlationId,
        });

        await outboxRepository.insert({
          subjectId: input.scope.subjectId,
          resourceId: resource.resourceId,
          eventType: 'medical_event.created',
          payload: {
            resourceId: resource.resourceId,
            subjectId: input.scope.subjectId,
            eventKind: resource.eventKind,
          },
        });

        const outcome = {
          resultResourceId: resource.resourceId,
          resultRevision: resource.revision,
          resultEtagToken: etagToken,
          storedHttpStatus: 201,
        };

        await idempotencyRepository.insertCommittedOutcome(
          idempotencyScope,
          fingerprint,
          outcome,
          expiresAt,
        );

        return {
          resource,
          etagToken,
          httpStatus: 201,
          replayed: false,
        };
      });
    },

    async getResource(scope, resourceId) {
      const resource = await eventRepository.getByResourceId(
        scope.subjectId,
        resourceId,
      );

      if (!resource) {
        throw new MedicalResourceNotFoundError('Medical resource not found.');
      }

      return {
        resource,
        etagToken: toEtag(resource),
      };
    },

    async listResources(input) {
      const limit = clampListLimit(input.limit);
      const scopeForCursor: ListCursorScope = {
        subjectId: input.scope.subjectId,
        apiVersion: input.apiVersion,
        limit,
        traversalStartedAt: '',
      };

      let effectiveTraversalStartedAt = new Date();
      let keysetCursor:
        | {
            eventObservedAt: Date;
            resourceId: string;
          }
        | undefined;

      if (input.cursor) {
        try {
          const decoded = listCursorTokens.decode(input.cursor, scopeForCursor);
          effectiveTraversalStartedAt = new Date(decoded.traversalStartedAt);
          keysetCursor = {
            eventObservedAt: new Date(decoded.eventObservedAt),
            resourceId: decoded.resourceId,
          };
        } catch (error) {
          if (
            error instanceof MalformedListCursorError ||
            error instanceof InvalidListCursorError
          ) {
            throw new InvalidMedicalListCursorError('List cursor is invalid.');
          }
          throw error;
        }
      }

      const rows = await eventRepository.listKeyset({
        subjectId: input.scope.subjectId,
        limit: limit + 1,
        traversalStartedAt: effectiveTraversalStartedAt,
        cursor: keysetCursor,
      });

      const hasMore = rows.length > limit;
      const pageRows = hasMore ? rows.slice(0, limit) : rows;
      const etagTokens = pageRows.map((resource) => toEtag(resource));

      let nextCursor: string | null = null;
      if (hasMore && pageRows.length > 0) {
        const last = pageRows[pageRows.length - 1]!;
        nextCursor = listCursorTokens.encode(
          {
            subjectId: input.scope.subjectId,
            apiVersion: input.apiVersion,
            limit,
            traversalStartedAt: effectiveTraversalStartedAt.toISOString(),
          },
          {
            eventObservedAt: last.eventObservedAt,
            resourceId: last.resourceId,
          },
        );
      }

      return {
        items: pageRows,
        etagTokens,
        nextCursor,
        hasMore,
      };
    },

    async updateWithRevision(input) {
      const parsed = parseIfMatch(input.resourceId, input.ifMatch);

      return database.transaction(async (tx) => {
        const txEventRepository = createMedicalEventRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const outboxRepository = createMedicalOutboxRepository(tx);

        const existing = await txEventRepository.getByResourceId(
          input.scope.subjectId,
          input.resourceId,
        );

        if (!existing) {
          throw new MedicalResourceNotFoundError('Medical resource not found.');
        }

        if (existing.revision !== parsed.revision) {
          throw new MedicalRevisionConflictError(
            'Medical resource revision conflict.',
          );
        }

        const patch: MedicalEventResourcePatch = {
          semanticEvent: input.semanticEvent,
          updatedByAccountId: input.scope.accountId,
        };

        const updated = await txEventRepository.updateWithRevision(
          input.scope.subjectId,
          input.resourceId,
          parsed.revision,
          patch,
        );

        if (!updated) {
          throw new MedicalRevisionConflictError(
            'Medical resource revision conflict.',
          );
        }

        await auditRepository.insert({
          actorAccountId: input.scope.accountId,
          subjectId: input.scope.subjectId,
          action: 'medical_event.update',
          resourceType: 'medical_event',
          resourceId: updated.resourceId,
          outcome: 'success',
          correlationId: input.scope.correlationId,
        });

        await outboxRepository.insert({
          subjectId: input.scope.subjectId,
          resourceId: updated.resourceId,
          eventType: 'medical_event.updated',
          payload: {
            resourceId: updated.resourceId,
            subjectId: input.scope.subjectId,
            eventKind: updated.eventKind,
          },
        });

        return {
          resource: updated,
          etagToken: toEtag(updated),
        };
      });
    },

    async deleteWithRevision(input) {
      const parsed = parseIfMatch(input.resourceId, input.ifMatch);

      await database.transaction(async (tx) => {
        const txEventRepository = createMedicalEventRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const outboxRepository = createMedicalOutboxRepository(tx);

        const existing = await txEventRepository.getByResourceId(
          input.scope.subjectId,
          input.resourceId,
        );

        if (!existing) {
          throw new MedicalResourceNotFoundError('Medical resource not found.');
        }

        if (existing.revision !== parsed.revision) {
          throw new MedicalRevisionConflictError(
            'Medical resource revision conflict.',
          );
        }

        const deleted = await txEventRepository.markDeletedWithRevision(
          input.scope.subjectId,
          input.resourceId,
          parsed.revision,
          input.scope.accountId,
        );

        if (!deleted) {
          throw new MedicalRevisionConflictError(
            'Medical resource revision conflict.',
          );
        }

        await auditRepository.insert({
          actorAccountId: input.scope.accountId,
          subjectId: input.scope.subjectId,
          action: 'medical_event.delete',
          resourceType: 'medical_event',
          resourceId: deleted.resourceId,
          outcome: 'success',
          correlationId: input.scope.correlationId,
        });

        await outboxRepository.insert({
          subjectId: input.scope.subjectId,
          resourceId: deleted.resourceId,
          eventType: 'medical_event.deleted',
          payload: {
            resourceId: deleted.resourceId,
            subjectId: input.scope.subjectId,
            eventKind: deleted.eventKind,
          },
        });
      });
    },
  };
}

function clampListLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_LIST_LIMIT;
  }

  const normalized = Math.trunc(limit);
  if (normalized <= 0) {
    return DEFAULT_LIST_LIMIT;
  }

  return Math.min(normalized, MAX_LIST_LIMIT);
}

export {
  createIdempotencyConflictError,
  MAX_LIST_LIMIT as MEDICAL_LIST_MAX_LIMIT,
  DEFAULT_LIST_LIMIT as MEDICAL_LIST_DEFAULT_LIMIT,
};
