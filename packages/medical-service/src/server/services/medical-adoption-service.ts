import { sql } from 'drizzle-orm';

import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  AdoptionBatchTooLargeError,
  AdoptionItemInvalidError,
  AdoptionNotEnabledError,
  AdoptionSessionClosedError,
  AdoptionSessionNotFoundError,
  AdoptionSourceConflictError,
  type AdoptionBatchResult,
  type AdoptionItemInput,
  type AdoptionItemResult,
  type CreateAdoptionSessionInput,
  type MedicalAdoptionSession,
} from '@diabetes-universe/medical-domain';
import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createAdoptionMappingRepository,
  createAdoptionSessionRepository,
  createMedicalAuditRepository,
  createMedicalEventRepository,
  createMedicalIdempotencyRepository,
  createMedicalOutboxRepository,
  createRequestFingerprint,
  createRevisionTokenService,
  type MedicalDatabase,
} from '@diabetes-universe/medical-persistence/server';

import type { AuthorizationScope } from '../types/authorization-scope';

export const MEDICAL_ADOPTION_OPERATION_SCOPE = 'adoption.import';
export const MEDICAL_MAX_ADOPTION_BATCH_ITEMS = 100;
export const MEDICAL_DEFAULT_ADOPTION_BATCH_ITEMS = 25;

export interface CreateOrResumeAdoptionSessionInput {
  readonly scope: AuthorizationScope;
  readonly apiVersion: string;
  readonly clientAdoptionRunId: string;
  readonly sourcePlatform: string;
  readonly sourceAppVersion: string;
  readonly sourceSchemaMin: number;
  readonly sourceSchemaMax: number;
  readonly eligibleCount?: number;
}

export interface AdoptBatchInput {
  readonly scope: AuthorizationScope;
  readonly apiVersion: string;
  readonly adoptionSessionId: string;
  readonly items: readonly AdoptionItemInput[];
}

export interface MedicalAdoptionService {
  createOrResumeSession(
    input: CreateOrResumeAdoptionSessionInput,
  ): Promise<MedicalAdoptionSession>;
  getSession(
    scope: AuthorizationScope,
    adoptionSessionId: string,
  ): Promise<MedicalAdoptionSession>;
  adoptBatch(input: AdoptBatchInput): Promise<AdoptionBatchResult>;
  completeSession(
    scope: AuthorizationScope,
    adoptionSessionId: string,
  ): Promise<MedicalAdoptionSession>;
  cancelSession(
    scope: AuthorizationScope,
    adoptionSessionId: string,
  ): Promise<MedicalAdoptionSession>;
}

function isTerminalLifecycle(state: string): boolean {
  return state === 'completed' || state === 'cancelled';
}

function acceptsBatches(state: string): boolean {
  return state === 'open' || state === 'failed';
}

function toAdoptionIdempotencyKey(
  sourceNamespace: string,
  localEventId: string,
): string {
  return `${sourceNamespace}:${localEventId}`;
}

export function createMedicalAdoptionService(
  database: MedicalDatabase,
  environment: MedicalEnvironment,
): MedicalAdoptionService {
  if (!environment.adoptionEnabled) {
    return createDisabledMedicalAdoptionService();
  }

  const allowTestDefault = environment.databaseMode === 'pglite';
  const revisionTokens = createRevisionTokenService(
    environment.revisionTokenSecret,
    { allowTestDefault },
  );
  const sessionRepository = createAdoptionSessionRepository(database);

  function assertAdoptionEnabled(): void {
    if (!environment.adoptionEnabled) {
      throw new AdoptionNotEnabledError(
        'Medical data adoption is not enabled.',
      );
    }
  }

  async function getSessionForScope(
    scope: AuthorizationScope,
    adoptionSessionId: string,
  ): Promise<MedicalAdoptionSession> {
    const session = await sessionRepository.findByIdForSubject(
      scope.subjectId,
      adoptionSessionId,
    );
    if (!session) {
      throw new AdoptionSessionNotFoundError('Adoption session was not found.');
    }
    return session;
  }

  async function adoptSingleItem(
    scope: AuthorizationScope,
    apiVersion: string,
    session: MedicalAdoptionSession,
    item: AdoptionItemInput,
  ): Promise<AdoptionItemResult> {
    const fingerprint = createRequestFingerprint(item.event);
    const idempotencyKey = toAdoptionIdempotencyKey(
      item.sourceNamespace,
      item.localEventId,
    );

    try {
      return await database.transaction(async (tx) => {
        const lockKey = [
          scope.subjectId,
          item.sourceNamespace,
          item.localEventId,
        ].join('|');

        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
        );

        const mappingRepository = createAdoptionMappingRepository(tx);
        const eventRepository = createMedicalEventRepository(tx);
        const auditRepository = createMedicalAuditRepository(tx);
        const outboxRepository = createMedicalOutboxRepository(tx);
        const idempotencyRepository = createMedicalIdempotencyRepository(tx);

        const existingMapping = await mappingRepository.findBySourceIdentity(
          scope.subjectId,
          item.sourceNamespace,
          item.localEventId,
        );

        if (existingMapping) {
          if (existingMapping.payloadFingerprint !== fingerprint) {
            throw new AdoptionSourceConflictError();
          }

          const resource = await eventRepository.getByResourceId(
            scope.subjectId,
            existingMapping.canonicalResourceId,
          );

          if (!resource) {
            throw new Error('Adoption mapping references missing resource.');
          }

          const etagToken = revisionTokens.createToken(
            resource.resourceId,
            resource.revision,
          );

          return {
            localEventId: item.localEventId,
            status: 'already_adopted',
            resourceId: resource.resourceId,
            revision: etagToken,
          };
        }

        const idempotencyScope = {
          accountId: scope.accountId,
          subjectId: scope.subjectId,
          apiVersion,
          operationScope: MEDICAL_ADOPTION_OPERATION_SCOPE,
          idempotencyKey,
        };

        const existingOutcome =
          await idempotencyRepository.findCommittedOutcome(
            idempotencyScope,
            fingerprint,
          );

        if (existingOutcome) {
          const resource = await eventRepository.getByResourceId(
            scope.subjectId,
            existingOutcome.resultResourceId,
          );
          if (!resource) {
            throw new Error('Idempotency record references missing resource.');
          }
          return {
            localEventId: item.localEventId,
            status: 'already_adopted',
            resourceId: resource.resourceId,
            revision: existingOutcome.resultEtagToken,
          };
        }

        await idempotencyRepository.assertNoConflictingOutcome(
          idempotencyScope,
          fingerprint,
        );

        const resource = await eventRepository.insert(scope.subjectId, {
          semanticEvent: item.event,
          createdByAccountId: scope.accountId,
        });

        const etagToken = revisionTokens.createToken(
          resource.resourceId,
          resource.revision,
        );

        await mappingRepository.insertMapping({
          subjectId: scope.subjectId,
          sourceNamespace: item.sourceNamespace,
          localEventId: item.localEventId,
          canonicalResourceId: resource.resourceId,
          canonicalRevision: resource.revision,
          sourceSchemaVersion: item.sourceSchemaVersion,
          payloadFingerprint: fingerprint,
          adoptionSessionId: session.adoptionSessionId,
        });

        await auditRepository.insert({
          actorAccountId: scope.accountId,
          subjectId: scope.subjectId,
          action: 'medical_event.local_adoption_create',
          resourceType: 'medical_event',
          resourceId: resource.resourceId,
          outcome: 'success',
          correlationId: scope.correlationId,
          detail: {
            adoptionSessionId: session.adoptionSessionId,
            sourceNamespace: item.sourceNamespace,
            localEventId: item.localEventId,
          },
        });

        await outboxRepository.insert({
          subjectId: scope.subjectId,
          resourceId: resource.resourceId,
          eventType: 'medical_event.adopted',
          payload: {
            resourceId: resource.resourceId,
            subjectId: scope.subjectId,
            eventKind: resource.eventKind,
            adoptionSessionId: session.adoptionSessionId,
          },
        });

        const expiresAt = new Date(
          Date.now() + environment.idempotencyRetentionHours * 60 * 60 * 1000,
        );

        await idempotencyRepository.insertCommittedOutcome(
          idempotencyScope,
          fingerprint,
          {
            resultResourceId: resource.resourceId,
            resultRevision: resource.revision,
            resultEtagToken: etagToken,
            storedHttpStatus: 201,
          },
          expiresAt,
        );

        return {
          localEventId: item.localEventId,
          status: 'adopted',
          resourceId: resource.resourceId,
          revision: etagToken,
          createdAt: resource.createdAt,
        };
      });
    } catch (error) {
      if (error instanceof AdoptionSourceConflictError) {
        return {
          localEventId: item.localEventId,
          status: 'failed',
          code: 'ADOPTION_SOURCE_CONFLICT',
          message: 'Source identity already adopted with different payload.',
        };
      }
      if (error instanceof AdoptionItemInvalidError) {
        return {
          localEventId: item.localEventId,
          status: 'failed',
          code: 'ADOPTION_ITEM_INVALID',
          message: error.message,
        };
      }
      throw error;
    }
  }

  return {
    async createOrResumeSession(input) {
      assertAdoptionEnabled();

      const existing = await sessionRepository.findByClientRunId(
        input.scope.accountId,
        input.clientAdoptionRunId,
      );

      if (existing && existing.subjectId === input.scope.subjectId) {
        if (isTerminalLifecycle(existing.lifecycleState)) {
          return existing;
        }
        if (existing.lifecycleState === 'failed') {
          const resumed = await sessionRepository.updateLifecycle(
            existing.adoptionSessionId,
            'open',
          );
          return resumed ?? existing;
        }
        return existing;
      }

      const createInput: CreateAdoptionSessionInput = {
        actorAccountId: input.scope.accountId,
        subjectId: input.scope.subjectId,
        clientAdoptionRunId: input.clientAdoptionRunId,
        sourcePlatform: input.sourcePlatform,
        sourceAppVersion: input.sourceAppVersion,
        sourceSchemaMin: input.sourceSchemaMin,
        sourceSchemaMax: input.sourceSchemaMax,
        eligibleCount: input.eligibleCount,
      };

      return sessionRepository.create(createInput);
    },

    async getSession(scope, adoptionSessionId) {
      assertAdoptionEnabled();
      return getSessionForScope(scope, adoptionSessionId);
    },

    async adoptBatch(input) {
      assertAdoptionEnabled();

      if (input.items.length === 0) {
        throw new AdoptionItemInvalidError('Adoption batch must not be empty.');
      }

      if (input.items.length > MEDICAL_MAX_ADOPTION_BATCH_ITEMS) {
        throw new AdoptionBatchTooLargeError();
      }

      const seenLocalIds = new Set<string>();
      for (const item of input.items) {
        if (seenLocalIds.has(item.localEventId)) {
          throw new AdoptionItemInvalidError(
            'Duplicate localEventId in adoption batch.',
          );
        }
        seenLocalIds.add(item.localEventId);
      }

      const session = await getSessionForScope(
        input.scope,
        input.adoptionSessionId,
      );

      if (!acceptsBatches(session.lifecycleState)) {
        throw new AdoptionSessionClosedError(
          'Adoption session is closed to new batches.',
        );
      }

      const results: AdoptionItemResult[] = [];
      let adoptedDelta = 0;
      let failedDelta = 0;
      let skippedDelta = 0;

      for (const item of input.items) {
        const result = await adoptSingleItem(
          input.scope,
          input.apiVersion,
          session,
          item,
        );
        results.push(result);

        if (result.status === 'adopted') {
          adoptedDelta += 1;
        } else if (result.status === 'already_adopted') {
          skippedDelta += 1;
        } else {
          failedDelta += 1;
        }
      }

      await sessionRepository.incrementCounters(session.adoptionSessionId, {
        adoptedCount: adoptedDelta,
        skippedCount: skippedDelta,
        failedCount: failedDelta,
      });

      return { items: results };
    },

    async completeSession(scope, adoptionSessionId) {
      assertAdoptionEnabled();
      const session = await getSessionForScope(scope, adoptionSessionId);

      if (session.lifecycleState === 'cancelled') {
        throw new AdoptionSessionClosedError(
          'Cancelled adoption session cannot be completed.',
        );
      }

      const updated = await sessionRepository.updateLifecycle(
        adoptionSessionId,
        'completed',
        { completedAt: new Date() },
      );

      if (!updated) {
        throw new AdoptionSessionNotFoundError(
          'Adoption session was not found.',
        );
      }

      return updated;
    },

    async cancelSession(scope, adoptionSessionId) {
      assertAdoptionEnabled();
      await getSessionForScope(scope, adoptionSessionId);

      const updated = await sessionRepository.updateLifecycle(
        adoptionSessionId,
        'cancelled',
        { completedAt: new Date() },
      );

      if (!updated) {
        throw new AdoptionSessionNotFoundError(
          'Adoption session was not found.',
        );
      }

      return updated;
    },
  };
}

function createDisabledMedicalAdoptionService(): MedicalAdoptionService {
  const disabled = () => {
    throw new AdoptionNotEnabledError('Medical data adoption is not enabled.');
  };

  return {
    createOrResumeSession: disabled,
    getSession: disabled,
    adoptBatch: disabled,
    completeSession: disabled,
    cancelSession: disabled,
  };
}
