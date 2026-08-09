import type {
  ActivityQuickAddEntry,
  ActivityTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticActivityTimelineEvent(
  entry: ActivityQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): ActivityTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const note = entry.note?.trim();

  return {
    activityType: entry.activityType.trim(),
    createdAt: now,
    durationSeconds: entry.durationMinutes * 60,
    id: createSemanticTimelineEventId('activity', entry.time),
    kind: 'activity',
    note: note || undefined,
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
