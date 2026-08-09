import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { compareTimelineDateTime } from './timeline-date-time';

export function compareSemanticTimelineEvents(
  left: SemanticTimelineEvent,
  right: SemanticTimelineEvent,
): number {
  const comparison = compareTimelineDateTime(left.occurredAt, right.occurredAt);

  if (comparison !== 0) {
    return comparison;
  }

  return left.id.localeCompare(right.id);
}

export function compareSemanticTimelineEventsDescending(
  left: SemanticTimelineEvent,
  right: SemanticTimelineEvent,
): number {
  const comparison = compareTimelineDateTime(left.occurredAt, right.occurredAt);

  if (comparison !== 0) {
    return -comparison;
  }

  return left.id.localeCompare(right.id);
}

export function sortSemanticTimelineEvents(
  events: readonly SemanticTimelineEvent[],
): SemanticTimelineEvent[] {
  return [...events].sort(compareSemanticTimelineEvents);
}
