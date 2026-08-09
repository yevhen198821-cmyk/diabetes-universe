import type {
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';

import {
  mapTimelineLegacyRepositoryProjection,
  type TimelinePresentationDependencies,
} from './presentation';

/**
 * Temporary P2 repository compatibility bridge (until P3h cutover).
 *
 * Reconstructs a legacy `TimelineEvent` shape for repository mutations only.
 * Invoked from the store write boundary (`timeline-semantic-write.ts`), not UI.
 */
export function projectSemanticToLegacyRepositoryEvent(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
): TimelineEvent {
  const projection = mapTimelineLegacyRepositoryProjection(event, dependencies);

  return {
    context: projection.context,
    createdAt: event.createdAt,
    dateTime: event.occurredAt,
    id: event.id,
    kind: event.kind,
    note: projection.note,
    source: event.source,
    title: projection.title,
    unit: projection.unit,
    updatedAt: event.updatedAt,
    value: projection.value,
  };
}
