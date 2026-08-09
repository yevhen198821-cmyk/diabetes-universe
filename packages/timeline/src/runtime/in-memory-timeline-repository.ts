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

interface InMemoryTimelineCursorPayload {
  readonly version: 1;
  readonly occurredAt: string;
  readonly id: string;
  readonly signature: string;
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

function isInOccurrenceRange(
  event: TimelineRepositoryEvent,
  query: TimelineRepositoryQuery,
): boolean {
  const eventTime = Date.parse(event.occurredAt);

  if (Number.isNaN(eventTime)) {
    return false;
  }

  if (query.occurredFrom !== undefined) {
    const fromTime = Date.parse(query.occurredFrom);
    if (Number.isNaN(fromTime) || eventTime < fromTime) {
      return false;
    }
  }

  if (query.occurredTo !== undefined) {
    const toTime = Date.parse(query.occurredTo);
    if (Number.isNaN(toTime) || eventTime >= toTime) {
      return false;
    }
  }

  return true;
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

    const allowedKinds = query.kinds ? new Set(query.kinds) : null;
    let events = this.#events.filter(
      (event) =>
        (allowedKinds === null || allowedKinds.has(event.kind)) &&
        isInOccurrenceRange(event, query),
    );

    if (query.order === 'occurredAt-desc') {
      events = [...events].reverse();
    }

    if (query.cursor !== undefined) {
      const cursor = decodeCursor(query.cursor, query);
      const cursorIndex = events.findIndex(
        (event) =>
          event.id === cursor.id && event.occurredAt === cursor.occurredAt,
      );

      if (cursorIndex === -1) {
        throw new TimelineRepositoryError('TIMELINE_REPOSITORY_INVALID_CURSOR');
      }

      events = events.slice(cursorIndex + 1);
    }

    const page = events.slice(0, query.limit);
    const hasMore = events.length > page.length;
    const lastEvent = page.at(-1);

    return {
      events: cloneTimelineRepositoryEvents(page),
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
