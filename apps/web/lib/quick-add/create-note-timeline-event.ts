import type {
  NoteQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';

export function createNoteTimelineEvent(
  entry: NoteQuickAddEntry,
): TimelineEvent {
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);
  const title = entry.title?.trim();

  return {
    dateTime,
    id: `note-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'note',
    source: 'manual',
    title: title && title.length > 0 ? title : 'Заметка',
    value: entry.text.trim(),
  };
}
