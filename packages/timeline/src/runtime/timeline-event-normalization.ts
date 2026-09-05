import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import type { TimelineRepositoryEvent } from '../contracts/timeline-repository';

function parseTimelineOccurredAt(occurredAt: string): number {
  return Date.parse(occurredAt);
}

function compareTimelineOccurredAt(
  leftOccurredAt: string,
  rightOccurredAt: string,
): number {
  const leftTime = parseTimelineOccurredAt(leftOccurredAt);
  const rightTime = parseTimelineOccurredAt(rightOccurredAt);
  const leftInvalid = Number.isNaN(leftTime);
  const rightInvalid = Number.isNaN(rightTime);

  if (leftInvalid && rightInvalid) {
    return leftOccurredAt.localeCompare(rightOccurredAt);
  }

  if (leftInvalid) {
    return 1;
  }

  if (rightInvalid) {
    return -1;
  }

  return leftTime - rightTime;
}

function cloneSemanticTimelineEvent(
  event: SemanticTimelineEvent,
): SemanticTimelineEvent {
  switch (event.kind) {
    case 'activity':
      return { ...event };
    case 'glucose':
      return { ...event };
    case 'insulin':
      return { ...event };
    case 'medication':
      return { ...event };
    case 'note':
      return { ...event };
    case 'nutrition':
      if (event.schemaVersion === 1) {
        return {
          ...event,
          products: event.products
            ? event.products.map((product) => ({ ...product }))
            : undefined,
        };
      }

      return {
        ...event,
        items: event.items
          ? event.items.map((item) => ({ ...item }))
          : undefined,
      };
  }
}

export function cloneTimelineRepositoryEvent(
  event: TimelineRepositoryEvent,
): TimelineRepositoryEvent {
  return cloneSemanticTimelineEvent(event);
}

export function cloneTimelineRepositoryEvents(
  events: readonly TimelineRepositoryEvent[],
): TimelineRepositoryEvent[] {
  return events.map((event) => cloneTimelineRepositoryEvent(event));
}

export function normalizeTimelineRepositoryEvents(
  events: readonly TimelineRepositoryEvent[],
): TimelineRepositoryEvent[] {
  const byId = new Map<string, TimelineRepositoryEvent>();

  for (const event of events) {
    byId.set(event.id, cloneTimelineRepositoryEvent(event));
  }

  return [...byId.values()].sort((left, right) => {
    const comparison = compareTimelineOccurredAt(
      left.occurredAt,
      right.occurredAt,
    );

    if (comparison !== 0) {
      return comparison;
    }

    return left.id.localeCompare(right.id);
  });
}
