import {
  cloneTimelineRepositoryEvent,
  TimelineRepositoryError,
  type TimelineRepositoryEvent,
} from '@diabetes-universe/timeline';

import {
  TIMELINE_STORAGE_SCHEMA_VERSION,
  type IndexedDbTimelineEventRecord,
} from './timeline-indexeddb-schema';
import { validateIndexedDbTimelineEventRecord } from './timeline-indexeddb-validation';

export function createIndexedDbTimelineEventRecord(
  event: TimelineRepositoryEvent,
  persistedAt: string,
): IndexedDbTimelineEventRecord {
  const clonedEvent = cloneTimelineRepositoryEvent(event);

  return {
    id: clonedEvent.id,
    occurredAt: clonedEvent.occurredAt,
    kind: clonedEvent.kind,
    event: clonedEvent,
    persistedAt,
    storageSchemaVersion: TIMELINE_STORAGE_SCHEMA_VERSION,
  };
}

export function readIndexedDbTimelineEventRecord(
  raw: unknown,
): TimelineRepositoryEvent {
  const validation = validateIndexedDbTimelineEventRecord(raw);

  if (validation.status !== 'ok') {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
  }

  return cloneTimelineRepositoryEvent(validation.record.event);
}
