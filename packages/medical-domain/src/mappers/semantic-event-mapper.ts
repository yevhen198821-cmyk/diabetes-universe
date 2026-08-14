import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import type { MedicalEventResource } from '../types/medical-event-resource';
import { medicalRevisionFromDb } from '../types/medical-revision';

const SERVER_OWNED_SEMANTIC_FIELDS = new Set(['id', 'createdAt', 'updatedAt']);

/**
 * Strips client-local lifecycle fields from semantic payload before persistence.
 */
export function toServerSemanticEvent(
  event: SemanticTimelineEvent,
): SemanticTimelineEvent {
  const { id, createdAt, updatedAt, ...rest } =
    event as SemanticTimelineEvent & {
      id?: string;
      createdAt?: string;
      updatedAt?: string;
    };

  void id;
  void createdAt;
  void updatedAt;

  return rest as SemanticTimelineEvent;
}

export function projectEventObservedAt(event: SemanticTimelineEvent): Date {
  return new Date(event.occurredAt);
}

export function projectEventKind(event: SemanticTimelineEvent): string {
  return event.kind;
}

export function projectSchemaVersion(event: SemanticTimelineEvent): number {
  return event.schemaVersion;
}

export function projectSourceLabel(
  event: SemanticTimelineEvent,
): string | null {
  const label = event.provenance?.label?.trim();
  return label && label.length > 0 ? label : null;
}

export function mapRowToMedicalEventResource(row: {
  resourceId: string;
  subjectId: string;
  lifecycleState: string;
  revision: bigint | number;
  eventObservedAt: Date;
  eventKind: string;
  schemaVersion: number;
  semanticEvent: SemanticTimelineEvent;
  sourceLabel: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdByAccountId: string;
  updatedByAccountId: string;
}): MedicalEventResource {
  return {
    resourceId: row.resourceId,
    subjectId: row.subjectId,
    lifecycleState:
      row.lifecycleState as MedicalEventResource['lifecycleState'],
    revision: medicalRevisionFromDb(row.revision),
    eventObservedAt: row.eventObservedAt.toISOString(),
    eventKind: row.eventKind,
    schemaVersion: row.schemaVersion,
    semanticEvent: row.semanticEvent,
    sourceLabel: row.sourceLabel,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt ? row.deletedAt.toISOString() : null,
    createdByAccountId: row.createdByAccountId,
    updatedByAccountId: row.updatedByAccountId,
  };
}

export const serverOwnedSemanticFieldNames = SERVER_OWNED_SEMANTIC_FIELDS;
