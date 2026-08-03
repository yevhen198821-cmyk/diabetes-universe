import type { TimelineEvent } from '@diabetes-universe/types';

import { compareTimelineDateTime } from '../timeline/timeline-date-time';
import {
  DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT,
  type TimelineRecentEvent,
} from '../timeline/timeline-selectors';

function parseLeadingNumber(value: string): number {
  const match = value.trim().match(/^([\d.,]+)/);

  if (!match) {
    return 0;
  }

  const parsed = Number(match[1].replace(',', '.'));

  return Number.isFinite(parsed) ? parsed : 0;
}

function mapDashboardRecentEventSource(
  event: TimelineEvent,
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

  const displayTime = formatDisplayTime(event.dateTime).trim();

  if (displayTime.length === 0 || displayTime === '--:--') {
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

/**
 * Dashboard Recent Events derivation path.
 * Mirrors `getRecentTimelineEvents` selection semantics with injected display-time formatting.
 */
export function deriveDashboardRecentEventSources(
  events: readonly TimelineEvent[],
  options: {
    readonly formatDisplayTime: (dateTime: string) => string;
    readonly limit?: number;
  },
): TimelineRecentEvent[] {
  const limit = options.limit ?? DEFAULT_RECENT_TIMELINE_EVENTS_LIMIT;

  return [...events]
    .sort((left, right) =>
      compareTimelineDateTime(right.dateTime, left.dateTime),
    )
    .map((event) =>
      mapDashboardRecentEventSource(event, options.formatDisplayTime),
    )
    .filter((event): event is TimelineRecentEvent => event !== null)
    .slice(0, limit);
}
