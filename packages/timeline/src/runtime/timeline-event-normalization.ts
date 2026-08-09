import type { TimelineRepositoryEvent } from '../contracts/timeline-repository';

function parseTimelineDateTime(dateTime: string): number {
  return Date.parse(dateTime);
}

function compareTimelineDateTime(
  leftDateTime: string,
  rightDateTime: string,
): number {
  const leftTime = parseTimelineDateTime(leftDateTime);
  const rightTime = parseTimelineDateTime(rightDateTime);
  const leftInvalid = Number.isNaN(leftTime);
  const rightInvalid = Number.isNaN(rightTime);

  if (leftInvalid && rightInvalid) {
    return leftDateTime.localeCompare(rightDateTime);
  }

  if (leftInvalid) {
    return 1;
  }

  if (rightInvalid) {
    return -1;
  }

  return leftTime - rightTime;
}

export function cloneTimelineRepositoryEvent(
  event: TimelineRepositoryEvent,
): TimelineRepositoryEvent {
  return { ...event };
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
    const comparison = compareTimelineDateTime(left.dateTime, right.dateTime);

    if (comparison !== 0) {
      return comparison;
    }

    return left.id.localeCompare(right.id);
  });
}
