import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  formatTimelineGlucoseDisplayValue,
  mapTimelineEventCardPresentation,
  resolveTimelinePresentationLocale,
  type TimelinePresentationDependencies,
} from '../timeline/presentation';
import {
  compareSemanticTimelineEvents,
  compareSemanticTimelineEventsDescending,
  sortSemanticTimelineEvents,
} from './semantic-timeline-ordering';
import {
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
} from './timeline-date-time';

export interface TimelineRecentEvent {
  readonly category: 'activity' | 'insulin' | 'medication' | 'nutrition';
  readonly context: string;
  readonly dateTime: string;
  readonly displayTime: string;
  readonly id: string;
  readonly title: string;
  readonly unit: string;
  readonly value: string;
}

export const DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT = 4;

function isSameLocalDay(
  occurredAt: string,
  referenceDate: Date,
  timeZone?: string,
): boolean {
  const eventDay = getTimelineCalendarDateKey(occurredAt, timeZone);
  const referenceDay = getTimelineCalendarDateKey(
    referenceDate.toISOString(),
    timeZone,
  );

  return (
    eventDay !== null && referenceDay !== null && eventDay === referenceDay
  );
}

function mapRecentEvent(
  event: SemanticTimelineEvent,
  dependencies: TimelinePresentationDependencies,
  locale: string,
  timeZone?: string,
): TimelineRecentEvent | null {
  const occurredAt = event.occurredAt;
  const displayTime = formatTimelineDisplayTime(occurredAt, locale, timeZone);

  if (displayTime === '--:--') {
    return null;
  }

  switch (event.kind) {
    case 'activity':
    case 'insulin':
    case 'medication':
    case 'nutrition': {
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
    default:
      return null;
  }
}

export function getLatestGlucoseEvent(
  events: readonly SemanticTimelineEvent[],
): Extract<SemanticTimelineEvent, { kind: 'glucose' }> | null {
  const glucoseEvents = events.filter(
    (event): event is Extract<SemanticTimelineEvent, { kind: 'glucose' }> =>
      event.kind === 'glucose',
  );

  return [...glucoseEvents].sort(compareSemanticTimelineEvents).at(-1) ?? null;
}

export function getTodayTimelineEvents(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): SemanticTimelineEvent[] {
  return sortSemanticTimelineEvents(
    events.filter((event) =>
      isSameLocalDay(event.occurredAt, referenceDate, timeZone),
    ),
  );
}

export function getRecentTimelineEvents(
  events: readonly SemanticTimelineEvent[],
  dependencies: TimelinePresentationDependencies,
  options: {
    readonly limit?: number;
    readonly locale?: string;
    readonly timeZone?: string;
  } = {},
): TimelineRecentEvent[] {
  const locale =
    options.locale ?? resolveTimelinePresentationLocale(dependencies);
  const limit = options.limit ?? DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT;

  return [...events]
    .sort(compareSemanticTimelineEventsDescending)
    .map((event) =>
      mapRecentEvent(event, dependencies, locale, options.timeZone),
    )
    .filter((event): event is TimelineRecentEvent => event !== null)
    .slice(0, limit);
}

export function getTodayInsulinTotal(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone)
    .filter((event) => event.kind === 'insulin')
    .reduce((total, event) => total + event.doseUnits, 0);
}

export function getTodayNutritionTotal(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone)
    .filter((event) => event.kind === 'nutrition')
    .reduce((total, event) => total + event.carbohydratesGrams, 0);
}

export function getTodayMedicationCount(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone).filter(
    (event) => event.kind === 'medication',
  ).length;
}

export function getTodayActivityTotalSeconds(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone)
    .filter((event) => event.kind === 'activity')
    .reduce((total, event) => total + event.durationSeconds, 0);
}

export function formatLatestGlucoseValue(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
  dependencies: TimelinePresentationDependencies,
): string {
  return formatTimelineGlucoseDisplayValue(event, dependencies);
}
