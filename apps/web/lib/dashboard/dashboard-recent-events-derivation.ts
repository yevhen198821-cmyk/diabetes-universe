import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  mapTimelineEventCardPresentation,
  type TimelinePresentationDependencies,
} from '../timeline/presentation';
import { compareSemanticTimelineEventsDescending } from '../timeline/semantic-timeline-ordering';
import { type TimelineRecentEvent } from '../timeline/timeline-selectors';

function mapDashboardRecentEventSource(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
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

  const occurredAt = event.occurredAt;
  const displayTime = formatDisplayTime(occurredAt).trim();

  if (displayTime.length === 0 || displayTime === '--:--') {
    return null;
  }

  const presentation = mapTimelineEventCardPresentation(
    event,
    dependencies,
    displayTime,
  );

  return {
    category: event.kind,
    context: presentation.context ?? '',
    dateTime: occurredAt,
    displayTime,
    id: event.id,
    title: presentation.title,
    unit: presentation.unit,
    value: presentation.value,
  };
}

/**
 * Dashboard Recent Events derivation path.
 * Mirrors `getRecentTimelineEvents` selection semantics with injected display-time formatting.
 */
export function deriveDashboardRecentEventSources(
  events: readonly SemanticTimelineEvent[],
  dependencies: TimelinePresentationDependencies,
  options: {
    readonly formatDisplayTime: (dateTime: string) => string;
    readonly limit?: number;
  },
): TimelineRecentEvent[] {
  const mapped = [...events]
    .sort(compareSemanticTimelineEventsDescending)
    .map((event) =>
      mapDashboardRecentEventSource(
        event,
        dependencies,
        options.formatDisplayTime,
      ),
    )
    .filter((event): event is TimelineRecentEvent => event !== null);

  if (options.limit === undefined) {
    return mapped;
  }

  return mapped.slice(0, options.limit);
}
