import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import {
  formatSemanticGlucoseDisplayValue,
  getSemanticEventCardContext,
  getSemanticEventCardTitle,
  getSemanticEventCardUnit,
  getSemanticEventCardValue,
  getSemanticEventOccurredAt,
} from './semantic-event-fields';
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
  locale: string,
  timeZone?: string,
): TimelineRecentEvent | null {
  const occurredAt = getSemanticEventOccurredAt(event);
  const displayTime = formatTimelineDisplayTime(occurredAt, locale, timeZone);

  if (displayTime === '--:--') {
    return null;
  }

  switch (event.kind) {
    case 'activity':
      return {
        category: 'activity',
        context: getSemanticEventCardContext(event) ?? '',
        dateTime: occurredAt,
        displayTime,
        id: event.id,
        title: getSemanticEventCardTitle(event),
        unit: getSemanticEventCardUnit(event) ?? '',
        value: getSemanticEventCardValue(event),
      };
    case 'insulin':
      return {
        category: 'insulin',
        context: getSemanticEventCardContext(event) ?? '',
        dateTime: occurredAt,
        displayTime,
        id: event.id,
        title: getSemanticEventCardTitle(event),
        unit: getSemanticEventCardUnit(event) ?? '',
        value: getSemanticEventCardValue(event),
      };
    case 'medication':
      return {
        category: 'medication',
        context: getSemanticEventCardContext(event) ?? '',
        dateTime: occurredAt,
        displayTime,
        id: event.id,
        title: getSemanticEventCardTitle(event),
        unit: getSemanticEventCardUnit(event) ?? '',
        value: getSemanticEventCardValue(event),
      };
    case 'nutrition':
      return {
        category: 'nutrition',
        context: '',
        dateTime: occurredAt,
        displayTime,
        id: event.id,
        title: getSemanticEventCardTitle(event),
        unit: getSemanticEventCardUnit(event) ?? '',
        value: getSemanticEventCardValue(event),
      };
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
      isSameLocalDay(
        getSemanticEventOccurredAt(event),
        referenceDate,
        timeZone,
      ),
    ),
  );
}

export function getRecentTimelineEvents(
  events: readonly SemanticTimelineEvent[],
  options: {
    readonly limit?: number;
    readonly locale?: string;
    readonly timeZone?: string;
  } = {},
): TimelineRecentEvent[] {
  const locale = options.locale ?? 'ru-RU';
  const limit = options.limit ?? DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT;

  return [...events]
    .sort(compareSemanticTimelineEventsDescending)
    .map((event) => mapRecentEvent(event, locale, options.timeZone))
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

export function formatLatestGlucoseValue(
  event: Extract<SemanticTimelineEvent, { kind: 'glucose' }>,
): string {
  return formatSemanticGlucoseDisplayValue(event);
}
