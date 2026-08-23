import type { SemanticTimelineEvent } from '@diabetes-universe/types';

export type AdoptionSessionLifecycleState =
  'open' | 'failed' | 'completed' | 'cancelled';

export interface AdoptionSourceIdentity {
  readonly sourceNamespace: string;
  readonly localEventId: string;
}

export interface AdoptionItemInput {
  readonly sourceNamespace: string;
  readonly localEventId: string;
  readonly sourceSchemaVersion: number;
  readonly event: SemanticTimelineEvent;
}

export type AdoptionItemOutcomeStatus =
  'adopted' | 'already_adopted' | 'failed';

export interface AdoptionItemSuccess {
  readonly localEventId: string;
  readonly status: 'adopted';
  readonly resourceId: string;
  readonly revision: string;
  readonly createdAt: string;
}

export interface AdoptionItemReplay {
  readonly localEventId: string;
  readonly status: 'already_adopted';
  readonly resourceId: string;
  readonly revision: string;
}

export interface AdoptionItemFailure {
  readonly localEventId: string;
  readonly status: 'failed';
  readonly code: string;
  readonly message: string;
}

export type AdoptionItemResult =
  AdoptionItemSuccess | AdoptionItemReplay | AdoptionItemFailure;

export interface AdoptionBatchResult {
  readonly items: readonly AdoptionItemResult[];
}

export interface MedicalAdoptionSession {
  readonly adoptionSessionId: string;
  readonly subjectId: string;
  readonly actorAccountId: string;
  readonly clientAdoptionRunId: string;
  readonly sourcePlatform: string;
  readonly sourceAppVersion: string;
  readonly sourceSchemaMin: number;
  readonly sourceSchemaMax: number;
  readonly lifecycleState: AdoptionSessionLifecycleState;
  readonly eligibleCount: number;
  readonly adoptedCount: number;
  readonly skippedCount: number;
  readonly failedCount: number;
  readonly createdAt: Date;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly updatedAt: Date;
}

export interface MedicalAdoptionMapping {
  readonly adoptionMappingId: string;
  readonly subjectId: string;
  readonly sourceNamespace: string;
  readonly localEventId: string;
  readonly canonicalResourceId: string;
  readonly canonicalRevision: bigint;
  readonly sourceSchemaVersion: number;
  readonly payloadFingerprint: string;
  readonly adoptedAt: Date;
  readonly adoptionSessionId: string;
}

export interface CreateAdoptionSessionInput {
  readonly actorAccountId: string;
  readonly subjectId: string;
  readonly clientAdoptionRunId: string;
  readonly sourcePlatform: string;
  readonly sourceAppVersion: string;
  readonly sourceSchemaMin: number;
  readonly sourceSchemaMax: number;
  readonly eligibleCount?: number;
}
