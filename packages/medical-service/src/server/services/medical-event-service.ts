import { sql } from 'drizzle-orm';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  createIdempotencyConflictError,
  type IdempotencyScope,
  type MedicalEventResource,
} from '@diabetes-universe/medical-domain';
import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createMedicalAuditRepository,
  createMedicalEventRepository,
  createMedicalIdempotencyRepository,
  createMedicalOutboxRepository,
  createRequestFingerprint,
  createRevisionTokenService,
  type MedicalDatabase,
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

export interface MedicalEventService {
  createWithIdempotency(
    input: CreateMedicalEventInput,
  ): Promise<CreateMedicalEventResult>;
}

export function createMedicalEventService(
  database: MedicalDatabase,
  environment: MedicalEnvironment,
): MedicalEventService {
  const revisionTokens = createRevisionTokenService(
    environment.revisionTokenSecret,
    { allowTestDefault: environment.databaseMode === 'pglite' },
  );

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
        const eventRepository = createMedicalEventRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const outboxRepository = createMedicalOutboxRepository(tx);

        const existing = await idempotencyRepository.findCommittedOutcome(
          idempotencyScope,
          fingerprint,
        );

        if (existing) {
          const resource = await eventRepository.getByResourceId(
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

        const resource = await eventRepository.insert(input.scope.subjectId, {
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
  };
}

export { createIdempotencyConflictError };
