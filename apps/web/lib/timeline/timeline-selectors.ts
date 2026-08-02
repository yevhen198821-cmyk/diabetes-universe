import type { TimelineEvent } from '@diabetes-universe/types';

import {
  compareTimelineDateTime,
  formatTimelineDisplayTime,
  getTimelineCalendarDateKey,
  sortTimelineEvents,
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

function parseLeadingNumber(value: string): number {
  const match = value.trim().match(/^([\d.,]+)/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1].replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function isSameLocalDay(
  dateTime: string,
  referenceDate: Date,
  timeZone?: string,
): boolean {
  const eventDay = getTimelineCalendarDateKey(dateTime, timeZone);
  const referenceDay = getTimelineCalendarDateKey(
    referenceDate.toISOString(),
    timeZone,
  );

  return (
    eventDay !== null && referenceDay !== null && eventDay === referenceDay
  );
}

function mapRecentEvent(
  event: TimelineEvent,
  locale: string,
  timeZone?: string,
): TimelineRecentEvent | null {
  const displayTime = formatTimelineDisplayTime(
    event.dateTime,
    locale,
    timeZone,
  );

  if (displayTime === '--:--') {
    return null;
  }

  switch (event.kind) {
    case 'activity':
      return {
        category: 'activity',
        context: event.context ?? '',
        dateTime: event.dateTime,
        displayTime,
        id: event.id,
        title: event.title,
        unit: event.unit ?? 'минут',
        value: event.value,
      };
    case 'insulin':
      return {
        category: 'insulin',
        context: event.context ?? '',
        dateTime: event.dateTime,
        displayTime,
        id: event.id,
        title: event.title,
        unit: 'ЕД',
        value: parseLeadingNumber(event.value).toString(),
      };
    case 'medication':
      return {
        category: 'medication',
        context: event.context ?? '',
        dateTime: event.dateTime,
        displayTime,
        id: event.id,
        title: event.title,
        unit: event.unit ?? '',
        value: event.value,
      };
    case 'nutrition':
      return {
        category: 'nutrition',
        context: event.context ?? '',
        dateTime: event.dateTime,
        displayTime,
        id: event.id,
        title: event.title,
        unit: 'г углеводов',
        value: parseLeadingNumber(event.value).toString(),
      };
    default:
      return null;
  }
}

export function getLatestGlucoseEvent(
  events: readonly TimelineEvent[],
): TimelineEvent | null {
  const glucoseEvents = events.filter((event) => event.kind === 'glucose');

  return sortTimelineEvents(glucoseEvents).at(-1) ?? null;
}

export function getTodayTimelineEvents(
  events: readonly TimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): TimelineEvent[] {
  return sortTimelineEvents(
    events.filter((event) =>
      isSameLocalDay(event.dateTime, referenceDate, timeZone),
    ),
  );
}

export function getRecentTimelineEvents(
  events: readonly TimelineEvent[],
  options: {
    readonly limit?: number;
    readonly locale?: string;
    readonly timeZone?: string;
  } = {},
): TimelineRecentEvent[] {
  const locale = options.locale ?? 'ru-RU';
  const limit = options.limit ?? DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT;

  return [...events]
    .sort((left, right) =>
      compareTimelineDateTime(right.dateTime, left.dateTime),
    )
    .map((event) => mapRecentEvent(event, locale, options.timeZone))
    .filter((event): event is TimelineRecentEvent => event !== null)
    .slice(0, limit);
}

export function getTodayInsulinTotal(
  events: readonly TimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone)
    .filter((event) => event.kind === 'insulin')
    .reduce((total, event) => total + parseLeadingNumber(event.value), 0);
}

export function getTodayNutritionTotal(
  events: readonly TimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone)
    .filter((event) => event.kind === 'nutrition')
    .reduce((total, event) => total + parseLeadingNumber(event.value), 0);
}

export function getTodayMedicationCount(
  events: readonly TimelineEvent[],
  referenceDate: Date = new Date(),
  timeZone?: string,
): number {
  return getTodayTimelineEvents(events, referenceDate, timeZone).filter(
    (event) => event.kind === 'medication',
  ).length;
}
