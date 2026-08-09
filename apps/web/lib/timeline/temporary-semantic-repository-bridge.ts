import type {
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';

import {
  mapTimelineLegacyRepositoryProjection,
  type TimelinePresentationDependencies,
} from './presentation';

/**
 * Temporary P3c repository compatibility bridge.
 *
 * Reconstructs a legacy `TimelineEvent` shape for P2 repository mutations
 * until P3e introduces the semantic write path. Output is not canonical and
 * must not be exposed through `useTimelineStore().events`.
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
