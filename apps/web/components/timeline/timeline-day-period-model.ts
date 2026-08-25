import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { compareSemanticTimelineEventsDescending } from '../../lib/timeline/semantic-timeline-ordering';
import { getTimelineMinutesFromMidnight } from '../../lib/timeline/timeline-date-time';

export type TimelineDayPeriodKey = 'day' | 'evening' | 'morning' | 'night';

export interface TimelineDayPeriodDefinition {
  readonly endMinutesInclusive: number;
  readonly key: TimelineDayPeriodKey;
  readonly startMinutesInclusive: number;
}

export interface TimelineDayPeriodGroup {
  readonly endMinutesInclusive: number;
  readonly eventCount: number;
  readonly events: readonly SemanticTimelineEvent[];
  readonly key: TimelineDayPeriodKey;
  readonly startMinutesInclusive: number;
}

export interface TimelineDayPeriodLabels {
  readonly day: string;
  readonly evening: string;
  readonly morning: string;
  readonly night: string;
}

export interface TimelineDayPeriodTimeRangeLabels {
  readonly day: string;
  readonly evening: string;
  readonly morning: string;
  readonly night: string;
}

export const TIMELINE_DAY_PERIOD_ORDER: readonly TimelineDayPeriodKey[] = [
  'night',
  'morning',
  'day',
  'evening',
];

export const TIMELINE_DAY_PERIOD_DEFINITIONS: readonly TimelineDayPeriodDefinition[] =
  [
    {
      endMinutesInclusive: 5 * 60 + 59,
      key: 'night',
      startMinutesInclusive: 0,
    },
    {
      endMinutesInclusive: 11 * 60 + 59,
      key: 'morning',
      startMinutesInclusive: 6 * 60,
    },
    {
      endMinutesInclusive: 17 * 60 + 59,
      key: 'day',
      startMinutesInclusive: 12 * 60,
    },
    {
      endMinutesInclusive: 23 * 60 + 59,
      key: 'evening',
      startMinutesInclusive: 18 * 60,
    },
  ];

const PERIOD_DEFINITION_BY_KEY = new Map(
  TIMELINE_DAY_PERIOD_DEFINITIONS.map((definition) => [
    definition.key,
    definition,
  ]),
);

export function resolveTimelineDayPeriodKey(
  minutesFromMidnight: number,
): TimelineDayPeriodKey | null {
  if (
    !Number.isInteger(minutesFromMidnight) ||
    minutesFromMidnight < 0 ||
    minutesFromMidnight > 23 * 60 + 59
  ) {
    return null;
  }

  for (const definition of TIMELINE_DAY_PERIOD_DEFINITIONS) {
    if (
      minutesFromMidnight >= definition.startMinutesInclusive &&
      minutesFromMidnight <= definition.endMinutesInclusive
    ) {
      return definition.key;
    }
  }

  return null;
}

export function resolveTimelineEventDayPeriodKey(
  occurredAt: string,
  timeZone?: string,
): TimelineDayPeriodKey | null {
  const minutesFromMidnight = getTimelineMinutesFromMidnight(
    occurredAt,
    timeZone,
  );

  if (minutesFromMidnight === null) {
    return null;
  }

  return resolveTimelineDayPeriodKey(minutesFromMidnight);
}

function sortEventsChronologicallyAscending(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return [...events].sort((left, right) => {
    const comparison = left.occurredAt.localeCompare(right.occurredAt);

    if (comparison !== 0) {
      return comparison;
    }

    return left.id.localeCompare(right.id);
  });
}

export function groupTimelineEventsByDayPeriod(
  events: readonly SemanticTimelineEvent[],
  timeZone?: string,
): readonly TimelineDayPeriodGroup[] {
  const groupedEvents = new Map<
    TimelineDayPeriodKey,
    SemanticTimelineEvent[]
  >();

  for (const event of events) {
    const periodKey = resolveTimelineEventDayPeriodKey(
      event.occurredAt,
      timeZone,
    );

    if (!periodKey) {
      continue;
    }

    const periodEvents = groupedEvents.get(periodKey) ?? [];
    groupedEvents.set(periodKey, [...periodEvents, event]);
  }

  return TIMELINE_DAY_PERIOD_ORDER.flatMap((periodKey) => {
    const periodEvents = groupedEvents.get(periodKey);

    if (!periodEvents || periodEvents.length === 0) {
      return [];
    }

    const definition = PERIOD_DEFINITION_BY_KEY.get(periodKey);

    if (!definition) {
      return [];
    }

    return [
      {
        endMinutesInclusive: definition.endMinutesInclusive,
        eventCount: periodEvents.length,
        events: sortEventsChronologicallyAscending(periodEvents),
        key: periodKey,
        startMinutesInclusive: definition.startMinutesInclusive,
      },
    ];
  });
}

export function resolveTimelineDayPeriodLabel(
  periodKey: TimelineDayPeriodKey,
  labels: TimelineDayPeriodLabels,
): string {
  return labels[periodKey];
}

export function resolveTimelineDayPeriodTimeRangeLabel(
  periodKey: TimelineDayPeriodKey,
  labels: TimelineDayPeriodTimeRangeLabels,
): string {
  return labels[periodKey];
}

export function compareTimelineDayPeriodGroupsForDisplay(
  left: TimelineDayPeriodGroup,
  right: TimelineDayPeriodGroup,
): number {
  return (
    TIMELINE_DAY_PERIOD_ORDER.indexOf(left.key) -
    TIMELINE_DAY_PERIOD_ORDER.indexOf(right.key)
  );
}

export function sortTimelineDayPeriodGroupsForDisplay(
  groups: readonly TimelineDayPeriodGroup[],
): readonly TimelineDayPeriodGroup[] {
  return [...groups].sort(compareTimelineDayPeriodGroupsForDisplay);
}

export function getTimelineDayPeriodNewestFirstEvents(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return [...events].sort(compareSemanticTimelineEventsDescending);
}
