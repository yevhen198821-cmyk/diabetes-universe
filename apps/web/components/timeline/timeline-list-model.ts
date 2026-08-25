import type { SemanticTimelineEvent } from '@diabetes-universe/types';

import { WEB_PLATFORM_DEFAULT_LOCALE } from '../../lib/platform/web-platform-defaults';
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
  readonly status:
    'empty' | 'error' | 'filtered-empty' | 'loading' | 'period-empty' | 'ready';
  readonly totalEventCount: number;
}

export interface TimelineListModelInput {
  readonly defaultErrorMessage: string;
  readonly error?: string;
  readonly events: readonly SemanticTimelineEvent[];
  readonly groupLabels?: Readonly<{
    readonly earlier: string;
    readonly today: string;
    readonly yesterday: string;
  }>;
  readonly hasActiveSearchOrCategoryCriteria?: boolean;
  readonly hasEventsInDateRange?: boolean;
  readonly locale?: string;
  readonly referenceDate?: Date;
  readonly status: TimelineStoreStatus;
  readonly timeZone?: string;
  readonly totalSourceEventCount?: number;
  readonly unknownDateLabel: string;
}

const INVALID_DATE_KEY = 'invalid-date';

function getGroupDateKey(
  event: SemanticTimelineEvent,
  timeZone?: string,
): string {
  return (
    getTimelineCalendarDateKey(event.occurredAt, timeZone) ?? INVALID_DATE_KEY
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
  unknownDateLabel: string,
  timeZone?: string,
  groupLabels?: TimelineListModelInput['groupLabels'],
): string {
  const firstValidEvent = events.find(
    (event) => getTimelineCalendarDateKey(event.occurredAt, timeZone) !== null,
  );

  if (!firstValidEvent) {
    return unknownDateLabel;
  }

  return formatTimelineDateGroupLabel(
    firstValidEvent.occurredAt,
    referenceDate,
    locale,
    timeZone,
    groupLabels,
  );
}

function createGroups(
  events: readonly SemanticTimelineEvent[],
  referenceDate: Date,
  locale: string,
  unknownDateLabel: string,
  timeZone?: string,
  groupLabels?: TimelineListModelInput['groupLabels'],
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
        label: createGroupLabel(
          sortedEvents,
          referenceDate,
          locale,
          unknownDateLabel,
          timeZone,
          groupLabels,
        ),
      };
    });
}

export function createTimelineListModel({
  defaultErrorMessage,
  error,
  events,
  groupLabels,
  hasActiveSearchOrCategoryCriteria = false,
  hasEventsInDateRange = true,
  locale = WEB_PLATFORM_DEFAULT_LOCALE,
  referenceDate = new Date(),
  status,
  timeZone,
  totalSourceEventCount = events.length,
  unknownDateLabel,
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
      errorMessage: error?.trim() || defaultErrorMessage,
      groups: [],
      status: 'error',
      totalEventCount: 0,
    };
  }

  if (
    events.length === 0 &&
    !hasEventsInDateRange &&
    totalSourceEventCount > 0
  ) {
    return {
      groups: [],
      status: 'period-empty',
      totalEventCount: 0,
    };
  }

  if (
    events.length === 0 &&
    hasActiveSearchOrCategoryCriteria &&
    hasEventsInDateRange
  ) {
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
    groups: createGroups(
      events,
      referenceDate,
      locale,
      unknownDateLabel,
      timeZone,
      groupLabels,
    ),
    status: 'ready',
    totalEventCount: events.length,
  };
}
