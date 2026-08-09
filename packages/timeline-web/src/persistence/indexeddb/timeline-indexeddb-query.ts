import {
  cloneTimelineRepositoryEvents,
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_SCAN,
  TimelineRepositoryError,
  type TimelineRepositoryEvent,
  type TimelineRepositoryQuery,
  type TimelineRepositoryQueryResult,
} from '@diabetes-universe/timeline';
import type { IDBPDatabase } from 'idb';

import { readIndexedDbTimelineEventRecord } from './timeline-indexeddb-record';
import {
  TIMELINE_INDEXEDDB_EVENT_INDEXES,
  TIMELINE_INDEXEDDB_STORES,
  type IndexedDbTimelineEventRecord,
} from './timeline-indexeddb-schema';

interface TimelineIndexedDbCursorPayload {
  readonly version: 1;
  readonly occurredAt: string;
  readonly id: string;
  readonly signature: string;
}

interface ValidatedOccurrenceRange {
  readonly fromTime?: number;
  readonly toTime?: number;
}

function createQuerySignature(query: TimelineRepositoryQuery): string {
  return JSON.stringify({
    kinds: query.kinds ? [...query.kinds].sort() : undefined,
    occurredFrom: query.occurredFrom,
    occurredTo: query.occurredTo,
    order: query.order,
  });
}

function encodeCursor(
  event: TimelineRepositoryEvent,
  query: TimelineRepositoryQuery,
): string {
  return encodeURIComponent(
    JSON.stringify({
      version: 1,
      occurredAt: event.occurredAt,
      id: event.id,
      signature: createQuerySignature(query),
    } satisfies TimelineIndexedDbCursorPayload),
  );
}

function decodeCursor(
  cursor: string,
  query: TimelineRepositoryQuery,
): TimelineIndexedDbCursorPayload {
  try {
    const value = JSON.parse(decodeURIComponent(cursor)) as unknown;

    if (
      typeof value !== 'object' ||
      value === null ||
      !('version' in value) ||
      value.version !== 1 ||
      !('occurredAt' in value) ||
      typeof value.occurredAt !== 'string' ||
      Number.isNaN(Date.parse(value.occurredAt)) ||
      !('id' in value) ||
      typeof value.id !== 'string' ||
      !('signature' in value) ||
      value.signature !== createQuerySignature(query)
    ) {
      throw new Error('invalid cursor');
    }

    return value as TimelineIndexedDbCursorPayload;
  } catch {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_INVALID_CURSOR');
  }
}

function validateOccurrenceRange(
  query: TimelineRepositoryQuery,
): ValidatedOccurrenceRange {
  let fromTime: number | undefined;
  let toTime: number | undefined;

  if (query.occurredFrom !== undefined) {
    fromTime = Date.parse(query.occurredFrom);
  }

  if (query.occurredTo !== undefined) {
    toTime = Date.parse(query.occurredTo);
  }

  if (
    (fromTime !== undefined && Number.isNaN(fromTime)) ||
    (toTime !== undefined && Number.isNaN(toTime)) ||
    (fromTime !== undefined && toTime !== undefined && fromTime >= toTime)
  ) {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
  }

  return { fromTime, toTime };
}

function isInOccurrenceRange(
  event: TimelineRepositoryEvent,
  range: ValidatedOccurrenceRange,
): boolean {
  const eventTime = Date.parse(event.occurredAt);

  if (Number.isNaN(eventTime)) {
    return false;
  }

  if (range.fromTime !== undefined && eventTime < range.fromTime) {
    return false;
  }

  if (range.toTime !== undefined && eventTime >= range.toTime) {
    return false;
  }

  return true;
}

function compareEventToCursor(
  event: TimelineRepositoryEvent,
  cursor: TimelineIndexedDbCursorPayload,
): number {
  const timeComparison = event.occurredAt.localeCompare(cursor.occurredAt);
  if (timeComparison !== 0) {
    return timeComparison;
  }

  return event.id.localeCompare(cursor.id);
}

function isAfterCursor(
  event: TimelineRepositoryEvent,
  cursor: TimelineIndexedDbCursorPayload | undefined,
  query: TimelineRepositoryQuery,
): boolean {
  if (cursor === undefined) {
    return true;
  }

  const comparison = compareEventToCursor(event, cursor);
  if (query.order === 'occurredAt-asc') {
    return comparison > 0;
  }

  return comparison < 0;
}

function createIndexKeyRange(
  query: TimelineRepositoryQuery,
): IDBKeyRange | undefined {
  if (query.kinds?.length === 1) {
    const kind = query.kinds[0];
    return IDBKeyRange.bound([kind, '', ''], [kind, '\uffff', '\uffff']);
  }

  return undefined;
}

export async function queryIndexedDbTimelineEvents(
  database: IDBPDatabase,
  query: TimelineRepositoryQuery,
): Promise<TimelineRepositoryQueryResult> {
  if (
    !Number.isInteger(query.limit) ||
    query.limit < 1 ||
    query.limit > IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT
  ) {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
  }

  const range = validateOccurrenceRange(query);
  let cursor: TimelineIndexedDbCursorPayload | undefined;
  if (query.cursor !== undefined) {
    cursor = decodeCursor(query.cursor, query);
  }

  const allowedKinds = query.kinds ? new Set(query.kinds) : null;
  const page: TimelineRepositoryEvent[] = [];
  let scanned = 0;
  const direction = query.order === 'occurredAt-desc' ? 'prev' : 'next';
  const indexName =
    query.kinds?.length === 1
      ? TIMELINE_INDEXEDDB_EVENT_INDEXES.byKindOccurredAtId
      : TIMELINE_INDEXEDDB_EVENT_INDEXES.byOccurredAtId;

  const transaction = database.transaction(
    TIMELINE_INDEXEDDB_STORES.events,
    'readonly',
  );

  try {
    const store = transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events);
    const index = store.index(indexName);
    let position = await index.openCursor(
      createIndexKeyRange(query),
      direction,
    );

    while (position) {
      scanned += 1;
      if (scanned > IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_SCAN) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
      }

      const event = readIndexedDbTimelineEventRecord(
        position.value as IndexedDbTimelineEventRecord,
      );

      if (
        isAfterCursor(event, cursor, query) &&
        isInOccurrenceRange(event, range) &&
        (allowedKinds === null || allowedKinds.has(event.kind))
      ) {
        page.push(event);
        if (page.length > query.limit) {
          break;
        }
      }

      position = await position.continue();
    }

    await transaction.done;
  } catch (error) {
    transaction.abort();
    if (error instanceof TimelineRepositoryError) {
      throw error;
    }

    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
  }

  const hasMore = page.length > query.limit;
  const visiblePage = hasMore ? page.slice(0, query.limit) : page;
  const lastEvent = visiblePage.at(-1);

  return {
    events: cloneTimelineRepositoryEvents(visiblePage),
    nextCursor:
      hasMore && lastEvent !== undefined
        ? encodeCursor(lastEvent, query)
        : undefined,
  };
}
