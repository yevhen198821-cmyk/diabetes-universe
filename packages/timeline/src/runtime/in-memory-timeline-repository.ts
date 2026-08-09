import {
  TimelineRepositoryError,
  type TimelineRepository,
  type TimelineRepositoryEvent,
  type TimelineRepositoryMutationResult,
  type TimelineRepositoryQuery,
  type TimelineRepositoryQueryResult,
  type TimelineRepositorySnapshot,
} from '../contracts/timeline-repository';
import {
  cloneTimelineRepositoryEvent,
  cloneTimelineRepositoryEvents,
  normalizeTimelineRepositoryEvents,
} from './timeline-event-normalization';

export const IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT = 200;
export const IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_SCAN = 1_000;

interface InMemoryTimelineCursorPayload {
  readonly version: 1;
  readonly occurredAt: string;
  readonly id: string;
  readonly signature: string;
}

interface ValidatedOccurrenceRange {
  readonly fromTime?: number;
  readonly toTime?: number;
}

export interface InMemoryTimelineRepositoryOptions {
  readonly seedEvents?: readonly TimelineRepositoryEvent[];
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
    } satisfies InMemoryTimelineCursorPayload),
  );
}

function decodeCursor(
  cursor: string,
  query: TimelineRepositoryQuery,
): InMemoryTimelineCursorPayload {
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

    return value as InMemoryTimelineCursorPayload;
  } catch {
    throw new TimelineRepositoryError('TIMELINE_REPOSITORY_INVALID_CURSOR');
  }
}

function validateOccurrenceRange(
  query: TimelineRepositoryQuery,
): ValidatedOccurrenceRange {
  const fromTime =
    query.occurredFrom === undefined
      ? undefined
      : Date.parse(query.occurredFrom);
  const toTime =
    query.occurredTo === undefined
      ? undefined
      : Date.parse(query.occurredTo);

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
  cursor: InMemoryTimelineCursorPayload,
): number {
  const timeComparison = event.occurredAt.localeCompare(cursor.occurredAt);
  if (timeComparison !== 0) {
    return timeComparison;
  }

  return event.id.localeCompare(cursor.id);
}

function isAfterCursor(
  event: TimelineRepositoryEvent,
  cursor: InMemoryTimelineCursorPayload | undefined,
  query: TimelineRepositoryQuery,
): boolean {
  if (cursor === undefined) {
    return true;
  }

  const comparison = compareEventToCursor(event, cursor);
  return query.order === 'occurredAt-asc' ? comparison > 0 : comparison < 0;
}

export class InMemoryTimelineRepository implements TimelineRepository {
  #events: readonly TimelineRepositoryEvent[] = [];
  #initialized = false;
  readonly #seedEvents: readonly TimelineRepositoryEvent[];

  constructor({ seedEvents = [] }: InMemoryTimelineRepositoryOptions = {}) {
    this.#seedEvents = cloneTimelineRepositoryEvents(seedEvents);
  }

  async initialize(): Promise<void> {
    if (this.#initialized) {
      return;
    }

    this.#events = normalizeTimelineRepositoryEvents(this.#seedEvents);
    this.#initialized = true;
  }

  getSnapshot(): TimelineRepositorySnapshot {
    this.#assertInitialized();

    return {
      events: cloneTimelineRepositoryEvents(this.#events),
    };
  }

  async getById(eventId: string): Promise<TimelineRepositoryEvent | null> {
    this.#assertInitialized();

    const event = this.#events.find((candidate) => candidate.id === eventId);
    return event ? cloneTimelineRepositoryEvent(event) : null;
  }

  async queryEvents(
    query: TimelineRepositoryQuery,
  ): Promise<TimelineRepositoryQueryResult> {
    this.#assertInitialized();

    if (
      !Number.isInteger(query.limit) ||
      query.limit < 1 ||
      query.limit > IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT
    ) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
    }

    const range = validateOccurrenceRange(query);
    const cursor =
      query.cursor === undefined
        ? undefined
        : decodeCursor(query.cursor, query);
    const allowedKinds = query.kinds ? new Set(query.kinds) : null;
    const sourceEvents =
      query.order === 'occurredAt-desc'
        ? [...this.#events].reverse()
        : this.#events;
    const page: TimelineRepositoryEvent[] = [];
    let scanned = 0;

    for (const event of sourceEvents) {
      if (!isAfterCursor(event, cursor, query)) {
        continue;
      }

      scanned += 1;
      if (scanned > IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_SCAN) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
      }

      if (
        !isInOccurrenceRange(event, range) ||
        (allowedKinds !== null && !allowedKinds.has(event.kind))
      ) {
        continue;
      }

      page.push(event);
      if (page.length > query.limit) {
        break;
      }
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

  async addEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    this.#events = normalizeTimelineRepositoryEvents([...this.#events, event]);

    return { status: 'applied' };
  }

  async updateEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    if (!this.#events.some((currentEvent) => currentEvent.id === event.id)) {
      return { status: 'not-found' };
    }

    this.#events = normalizeTimelineRepositoryEvents(
      this.#events.map((currentEvent) =>
        currentEvent.id === event.id ? event : currentEvent,
      ),
    );

    return { status: 'applied' };
  }

  async deleteEvent(
    eventId: string,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    if (!this.#events.some((event) => event.id === eventId)) {
      return { status: 'not-found' };
    }

    this.#events = this.#events.filter((event) => event.id !== eventId);

    return { status: 'applied' };
  }

  async replaceEvents(
    events: readonly TimelineRepositoryEvent[],
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    this.#events = normalizeTimelineRepositoryEvents(events);

    return { status: 'applied' };
  }

  #assertInitialized(): void {
    if (!this.#initialized) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_NOT_INITIALIZED');
    }
  }
}

export function createInMemoryTimelineRepository(
  options: InMemoryTimelineRepositoryOptions = {},
): TimelineRepository {
  return new InMemoryTimelineRepository(options);
}
