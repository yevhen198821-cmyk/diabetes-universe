import type {
  NoteQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';

export function createNoteTimelineEvent(
  entry: NoteQuickAddEntry,
): TimelineEvent {
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    dateTime,
    id: `note-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'note',
    source: 'manual',
    title: entry.title,
    value: entry.text.trim(),
  };
}
