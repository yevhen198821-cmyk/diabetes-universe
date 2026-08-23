import { sql } from 'drizzle-orm';

import {
  AdoptionBatchTooLargeError,
  AdoptionItemInvalidError,
  AdoptionNotEnabledError,
  AdoptionSessionClosedError,
  AdoptionSessionIncompleteError,
  AdoptionSessionNotFoundError,
  type AdoptionBatchResult,
  type AdoptionItemInput,
  type AdoptionItemResult,
  type CreateAdoptionSessionInput,
  type MedicalAdoptionSession,
} from '@diabetes-universe/medical-domain';
import type { MedicalEnvironment } from '@diabetes-universe/medical-persistence/server';
import {
  createAdoptionItemStateRepository,
  createAdoptionSourceIdentityLockKey,
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

interface AdoptSingleItemOutcome {
  readonly result: AdoptionItemResult;
  readonly adoptedDelta: number;
  readonly skippedDelta: number;
  readonly failedDelta: number;
}

function mapCounterDelta(delta: {
  adoptedCount: number;
  skippedCount: number;
  failedCount: number;
}): Pick<
  AdoptSingleItemOutcome,
  'adoptedDelta' | 'skippedDelta' | 'failedDelta'
> {
  return {
    adoptedDelta: delta.adoptedCount,
    skippedDelta: delta.skippedCount,
    failedDelta: delta.failedCount,
  };
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
  const itemStateRepository = createAdoptionItemStateRepository(database);

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
  ): Promise<AdoptSingleItemOutcome> {
    const fingerprint = createRequestFingerprint(item.event);
    const idempotencyKey = toAdoptionIdempotencyKey(
      item.sourceNamespace,
      item.localEventId,
    );

    return database.transaction(async (tx) => {
      const sessionRepository = createAdoptionSessionRepository(tx);
      const itemStateRepository = createAdoptionItemStateRepository(tx);
      const lifecycle = await sessionRepository.lockSessionLifecycleForUpdate(
        scope.subjectId,
        session.adoptionSessionId,
      );

      if (!lifecycle || !acceptsBatches(lifecycle)) {
        return {
          result: {
            localEventId: item.localEventId,
            status: 'failed',
            code: 'ADOPTION_SESSION_CLOSED',
            message: 'Adoption session is closed to new batches.',
          },
          adoptedDelta: 0,
          skippedDelta: 0,
          failedDelta: 0,
        };
      }

      const lockKey = createAdoptionSourceIdentityLockKey(
        scope.subjectId,
        item.sourceNamespace,
        item.localEventId,
      );

      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

      const mappingRepository = createAdoptionMappingRepository(tx);
      const eventRepository = createMedicalEventRepository(tx);
      const auditRepository = createMedicalAuditRepository(tx);
      const outboxRepository = createMedicalOutboxRepository(tx);
      const idempotencyRepository = createMedicalIdempotencyRepository(tx);

      const recordOutcome = (input: {
        outcome: 'failed' | 'adopted' | 'reconciled';
        failureCode?: string | null;
        canonicalResourceId?: string | null;
      }) =>
        itemStateRepository.recordOutcome({
          subjectId: scope.subjectId,
          adoptionSessionId: session.adoptionSessionId,
          sourceNamespace: item.sourceNamespace,
          localEventId: item.localEventId,
          payloadFingerprint: fingerprint,
          outcome: input.outcome,
          failureCode: input.failureCode ?? null,
          canonicalResourceId: input.canonicalResourceId ?? null,
        });

      const existingMapping = await mappingRepository.findBySourceIdentity(
        scope.subjectId,
        item.sourceNamespace,
        item.localEventId,
      );

      if (existingMapping) {
        if (existingMapping.payloadFingerprint !== fingerprint) {
          const delta = await recordOutcome({
            outcome: 'failed',
            failureCode: 'ADOPTION_SOURCE_CONFLICT',
          });
          return {
            result: {
              localEventId: item.localEventId,
              status: 'failed',
              code: 'ADOPTION_SOURCE_CONFLICT',
              message:
                'Source identity already adopted with different payload.',
            },
            ...mapCounterDelta(delta),
          };
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

        const delta = await recordOutcome({
          outcome: 'reconciled',
          canonicalResourceId: resource.resourceId,
        });

        return {
          result: {
            localEventId: item.localEventId,
            status: 'already_adopted',
            resourceId: resource.resourceId,
            revision: etagToken,
          },
          ...mapCounterDelta(delta),
        };
      }

      const idempotencyScope = {
        accountId: scope.accountId,
        subjectId: scope.subjectId,
        apiVersion,
        operationScope: MEDICAL_ADOPTION_OPERATION_SCOPE,
        idempotencyKey,
      };

      const existingOutcome = await idempotencyRepository.findCommittedOutcome(
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

        const delta = await recordOutcome({
          outcome: 'reconciled',
          canonicalResourceId: resource.resourceId,
        });

        return {
          result: {
            localEventId: item.localEventId,
            status: 'already_adopted',
            resourceId: resource.resourceId,
            revision: existingOutcome.resultEtagToken,
          },
          ...mapCounterDelta(delta),
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

      const delta = await recordOutcome({
        outcome: 'adopted',
        canonicalResourceId: resource.resourceId,
      });

      return {
        result: {
          localEventId: item.localEventId,
          status: 'adopted',
          resourceId: resource.resourceId,
          revision: etagToken,
          createdAt: resource.createdAt,
        },
        ...mapCounterDelta(delta),
      };
    });
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
          const resumed = await sessionRepository.transitionLifecycle(
            input.scope.subjectId,
            existing.adoptionSessionId,
            ['failed'],
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

      const results: AdoptionItemResult[] = [];
      let adoptedDelta = 0;
      let failedDelta = 0;
      let skippedDelta = 0;

      for (const item of input.items) {
        try {
          const outcome = await adoptSingleItem(
            input.scope,
            input.apiVersion,
            session,
            item,
          );
          results.push(outcome.result);
          adoptedDelta += outcome.adoptedDelta;
          skippedDelta += outcome.skippedDelta;
          failedDelta += outcome.failedDelta;
        } catch (error) {
          if (error instanceof AdoptionItemInvalidError) {
            const fingerprint = createRequestFingerprint(item.event);
            const delta = await itemStateRepository.recordOutcome({
              subjectId: input.scope.subjectId,
              adoptionSessionId: session.adoptionSessionId,
              sourceNamespace: item.sourceNamespace,
              localEventId: item.localEventId,
              payloadFingerprint: fingerprint,
              outcome: 'failed',
              failureCode: 'ADOPTION_ITEM_INVALID',
            });
            results.push({
              localEventId: item.localEventId,
              status: 'failed',
              code: 'ADOPTION_ITEM_INVALID',
              message: error.message,
            });
            adoptedDelta += delta.adoptedCount;
            skippedDelta += delta.skippedCount;
            failedDelta += delta.failedCount;
            continue;
          }
          throw error;
        }
      }

      if (adoptedDelta !== 0 || skippedDelta !== 0 || failedDelta !== 0) {
        await sessionRepository.incrementCounters(
          input.scope.subjectId,
          session.adoptionSessionId,
          {
            adoptedCount: adoptedDelta,
            skippedCount: skippedDelta,
            failedCount: failedDelta,
          },
        );
      }

      const unresolvedCount = await itemStateRepository.countUnresolved(
        input.scope.subjectId,
        session.adoptionSessionId,
      );

      if (unresolvedCount > 0 && session.lifecycleState === 'open') {
        await sessionRepository.transitionLifecycle(
          input.scope.subjectId,
          session.adoptionSessionId,
          ['open'],
          'failed',
        );
      } else if (unresolvedCount === 0 && session.lifecycleState === 'failed') {
        await sessionRepository.transitionLifecycle(
          input.scope.subjectId,
          session.adoptionSessionId,
          ['failed'],
          'open',
        );
      }

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

      const unresolvedCount = await itemStateRepository.countUnresolved(
        scope.subjectId,
        adoptionSessionId,
      );

      if (unresolvedCount > 0) {
        throw new AdoptionSessionIncompleteError(
          'Adoption session has unresolved failed items.',
        );
      }

      const updated = await sessionRepository.transitionLifecycle(
        scope.subjectId,
        adoptionSessionId,
        ['open', 'failed'],
        'completed',
        { completedAt: new Date() },
      );

      if (!updated) {
        const current = await sessionRepository.findByIdForSubject(
          scope.subjectId,
          adoptionSessionId,
        );
        if (!current) {
          throw new AdoptionSessionNotFoundError(
            'Adoption session was not found.',
          );
        }
        if (current.lifecycleState === 'completed') {
          return current;
        }
        throw new AdoptionSessionClosedError(
          'Adoption session is closed to completion.',
        );
      }

      return updated;
    },

    async cancelSession(scope, adoptionSessionId) {
      assertAdoptionEnabled();
      await getSessionForScope(scope, adoptionSessionId);

      const updated = await sessionRepository.transitionLifecycle(
        scope.subjectId,
        adoptionSessionId,
        ['open', 'failed'],
        'cancelled',
        { completedAt: new Date() },
      );

      if (!updated) {
        const current = await sessionRepository.findByIdForSubject(
          scope.subjectId,
          adoptionSessionId,
        );
        if (!current) {
          throw new AdoptionSessionNotFoundError(
            'Adoption session was not found.',
          );
        }
        if (current.lifecycleState === 'cancelled') {
          return current;
        }
        throw new AdoptionSessionClosedError(
          'Adoption session is closed to cancellation.',
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
