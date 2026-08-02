import type {
  ActivityQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';
import { formatActivityDuration } from './format-activity';

export function createActivityTimelineEvent(
  entry: ActivityQuickAddEntry,
): TimelineEvent {
  const note = entry.note?.trim();
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    dateTime,
    id: `activity-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'activity',
    note: note || undefined,
    source: 'manual',
    title: entry.activityType,
    unit: 'мин',
    value: formatActivityDuration(entry.durationMinutes),
  };
}
