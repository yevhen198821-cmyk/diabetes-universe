import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { getSemanticEventOccurredAt } from '../../lib/timeline/semantic-event-fields';
import { compareSemanticTimelineEventsDescending } from '../../lib/timeline/semantic-timeline-ordering';
import {
  formatTimelineDateGroupLabel,
  getTimelineCalendarDateKey,
} from '../../lib/timeline/timeline-date-time';
import type { TimelineStoreStatus } from '../../lib/timeline/timeline-store';

export interface TimelineListGroup {
  readonly dateKey: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly key: string;
  readonly label: string;
}

export interface TimelineListModel {
  readonly errorMessage?: string;
  readonly groups: readonly TimelineListGroup[];
  readonly status: 'empty' | 'error' | 'filtered-empty' | 'loading' | 'ready';
  readonly totalEventCount: number;
}

export interface TimelineListModelInput {
  readonly error?: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly hasActiveCriteria?: boolean;
  readonly locale?: string;
  readonly referenceDate?: Date;
  readonly status: TimelineStoreStatus;
  readonly timeZone?: string;
  readonly totalSourceEventCount?: number;
}

const DEFAULT_ERROR_MESSAGE =
  'Попробуйте обновить страницу или вернуться позже.';
const INVALID_DATE_KEY = 'invalid-date';

function getGroupDateKey(
  event: SemanticTimelineEvent,
  timeZone?: string,
): string {
  return (
    getTimelineCalendarDateKey(getSemanticEventOccurredAt(event), timeZone) ??
    INVALID_DATE_KEY
  );
}

function compareGroupDateKeys(left: string, right: string): number {
  if (left === INVALID_DATE_KEY && right === INVALID_DATE_KEY) {
    return 0;
  }

  if (left === INVALID_DATE_KEY) {
    return 1;
  }

  if (right === INVALID_DATE_KEY) {
    return -1;
  }

  return right.localeCompare(left);
}

function sortEventsNewestFirst(
  events: readonly SemanticTimelineEvent[],
): readonly SemanticTimelineEvent[] {
  return [...events].sort(compareSemanticTimelineEventsDescending);
}

function createGroupLabel(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date,
  locale: string,
  timeZone?: string,
): string {
  const firstValidEvent = events.find(
    (event) =>
      getTimelineCalendarDateKey(
        getSemanticEventOccurredAt(event),
        timeZone,
      ) !== null,
  );

  if (!firstValidEvent) {
    return 'Дата неизвестна';
  }

  return formatTimelineDateGroupLabel(
    getSemanticEventOccurredAt(firstValidEvent),
    referenceDate,
    locale,
    timeZone,
  );
}

function createGroups(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date,
  locale: string,
  timeZone?: string,
): readonly TimelineListGroup[] {
  const groupedEvents = new Map<string, SemanticTimelineEvent[]>();

  for (const event of events) {
    const dateKey = getGroupDateKey(event, timeZone);
    const groupEvents = groupedEvents.get(dateKey) ?? [];

    groupedEvents.set(dateKey, [...groupEvents, event]);
  }

  return [...groupedEvents.entries()]
    .sort(([leftDateKey], [rightDateKey]) =>
      compareGroupDateKeys(leftDateKey, rightDateKey),
    )
    .map(([dateKey, groupEvents]) => {
      const sortedEvents = sortEventsNewestFirst(groupEvents);

      return {
        dateKey,
        events: sortedEvents,
        key: `timeline-group-${dateKey}`,
        label: createGroupLabel(sortedEvents, referenceDate, locale, timeZone),
      };
    });
}

export function createTimelineListModel({
  error,
  events,
  hasActiveCriteria = false,
  locale = 'ru-RU',
  referenceDate = new Date(),
  status,
  timeZone,
  totalSourceEventCount = events.length,
}: TimelineListModelInput): TimelineListModel {
  if (status === 'loading') {
    return {
      groups: [],
      status: 'loading',
      totalEventCount: 0,
    };
  }

  if (status === 'error') {
    return {
      errorMessage: error?.trim() || DEFAULT_ERROR_MESSAGE,
      groups: [],
      status: 'error',
      totalEventCount: 0,
    };
  }

  if (events.length === 0 && hasActiveCriteria && totalSourceEventCount > 0) {
    return {
      groups: [],
      status: 'filtered-empty',
      totalEventCount: 0,
    };
  }

  if (events.length === 0) {
    return {
      groups: [],
      status: 'empty',
      totalEventCount: 0,
    };
  }

  return {
    groups: createGroups(events, referenceDate, locale, timeZone),
    status: 'ready',
    totalEventCount: events.length,
  };
}
