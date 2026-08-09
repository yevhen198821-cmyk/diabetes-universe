import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  getSemanticEventCardContext,
  getSemanticEventCardTitle,
  getSemanticEventCardUnit,
  getSemanticEventCardValue,
  getSemanticEventOccurredAt,
} from '../timeline/semantic-event-fields';
import { compareSemanticTimelineEventsDescending } from '../timeline/semantic-timeline-ordering';
import {
  DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT,
  type TimelineRecentEvent,
} from '../timeline/timeline-selectors';

function mapDashboardRecentEventSource(
  event: SemanticTimelineEvent,
  formatDisplayTime: (dateTime: string) => string,
): TimelineRecentEvent | null {
  switch (event.kind) {
    case 'activity':
    case 'insulin':
    case 'medication':
    case 'nutrition':
      break;
    default:
      return null;
  }

  const occurredAt = getSemanticEventOccurredAt(event);
  const displayTime = formatDisplayTime(occurredAt).trim();

  if (displayTime.length === 0 || displayTime === '--:--') {
    return null;
  }

  return {
    category: event.kind,
    context: getSemanticEventCardContext(event) ?? '',
    dateTime: occurredAt,
    displayTime,
    id: event.id,
    title: getSemanticEventCardTitle(event),
    unit: getSemanticEventCardUnit(event) ?? '',
    value: getSemanticEventCardValue(event),
  };
}

/**
 * Dashboard Recent Events derivation path.
 * Mirrors `getRecentTimelineEvents` selection semantics with injected display-time formatting.
 */
export function deriveDashboardRecentEventSources(
  events: readonly SemanticTimelineEvent[],
  options: {
    readonly formatDisplayTime: (dateTime: string) => string;
    readonly limit?: number;
  },
): TimelineRecentEvent[] {
  const limit = options.limit ?? DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT;

  return [...events]
    .sort(compareSemanticTimelineEventsDescending)
    .map((event) =>
      mapDashboardRecentEventSource(event, options.formatDisplayTime),
    )
    .filter((event): event is TimelineRecentEvent => event !== null)
    .slice(0, limit);
}
