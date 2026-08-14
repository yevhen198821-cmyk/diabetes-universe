import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import type { MedicalEventLifecycleState } from './lifecycle';
import type { MedicalRevision } from './medical-revision';

/**
 * Server-owned envelope around infrastructure-neutral semantic payload.
 */
export interface MedicalEventResource {
  readonly resourceId: string;
  readonly subjectId: string;
  readonly lifecycleState: MedicalEventLifecycleState;
  /** Monotonic server revision; opaque at API boundary. */
  readonly revision: MedicalRevision;
  readonly eventObservedAt: string;
  readonly eventKind: string;
  readonly schemaVersion: number;
  readonly semanticEvent: SemanticTimelineEvent;
  readonly sourceLabel: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly deletedAt: string | null;
  readonly createdByAccountId: string;
  readonly updatedByAccountId: string;
}

export interface MedicalEventResourceInsert {
  readonly semanticEvent: SemanticTimelineEvent;
  readonly createdByAccountId: string;
}

export interface MedicalEventResourcePatch {
  readonly semanticEvent: SemanticTimelineEvent;
  readonly updatedByAccountId: string;
}
