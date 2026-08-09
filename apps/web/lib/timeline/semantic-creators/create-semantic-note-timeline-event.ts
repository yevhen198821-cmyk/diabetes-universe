import type {
  NoteQuickAddEntry,
  NoteTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticNoteTimelineEvent(
  entry: NoteQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): NoteTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const title = entry.title?.trim();
  const body = entry.text.trim();

  return {
    body,
    createdAt: now,
    id: createSemanticTimelineEventId('note', entry.time),
    kind: 'note',
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    title: title && title.length > 0 ? title : undefined,
    updatedAt: now,
  };
}
