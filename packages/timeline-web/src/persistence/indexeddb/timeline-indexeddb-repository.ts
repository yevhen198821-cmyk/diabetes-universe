import {
  cloneTimelineRepositoryEvent,
  normalizeTimelineRepositoryEvents,
  TimelineRepositoryError,
  type TimelineRepository,
  type TimelineRepositoryEvent,
  type TimelineRepositoryMutationResult,
  type TimelineRepositoryQuery,
  type TimelineRepositoryQueryResult,
  type TimelineRepositorySnapshot,
} from '@diabetes-universe/timeline';
import type { IDBPDatabase } from 'idb';

import {
  createIndexedDbTimelineEventRecord,
  readIndexedDbTimelineEventRecord,
} from './timeline-indexeddb-record';
import type { TimelineIndexedDbConnection } from './timeline-indexeddb-connection';
import {
  openTimelineIndexedDB,
  type TimelineIndexedDbOpenOptions,
} from './timeline-indexeddb-open';
import { queryIndexedDbTimelineEvents } from './timeline-indexeddb-query';
import { TIMELINE_INDEXEDDB_STORES } from './timeline-indexeddb-schema';

export class IndexedDbTimelineRepository implements TimelineRepository {
  #database: IDBPDatabase | null = null;
  #connection: TimelineIndexedDbConnection | null = null;
  #initialized = false;
  readonly #options: TimelineIndexedDbOpenOptions;
  readonly #now: () => string;

  constructor(
    options: TimelineIndexedDbOpenOptions = {},
    dependencies: { readonly now?: () => string } = {},
  ) {
    this.#options = options;
    this.#now = dependencies.now ?? (() => new Date().toISOString());
  }

  async initialize(): Promise<void> {
    if (this.#initialized && this.#database !== null) {
      return;
    }

    const result = await openTimelineIndexedDB({
      ...this.#options,
      now: this.#now,
    });

    if (
      result.bootstrapState.phase !== 'ready' ||
      result.bootstrapState.error
    ) {
      result.connection.close();
      throw (
        result.bootstrapState.error ??
        new TimelineRepositoryError('TIMELINE_REPOSITORY_INITIALIZE_FAILED')
      );
    }

    this.#connection = result.connection;
    this.#database = result.connection.database;
    this.#initialized = true;
  }

  getSnapshot(): TimelineRepositorySnapshot {
    this.#assertInitialized();

    return { events: [] };
  }

  async getById(eventId: string): Promise<TimelineRepositoryEvent | null> {
    this.#assertInitialized();

    try {
      const record = await this.#database!.transaction(
        TIMELINE_INDEXEDDB_STORES.events,
        'readonly',
      )
        .objectStore(TIMELINE_INDEXEDDB_STORES.events)
        .get(eventId);

      if (record === undefined) {
        return null;
      }

      return readIndexedDbTimelineEventRecord(record);
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
    }
  }

  async queryEvents(
    query: TimelineRepositoryQuery,
  ): Promise<TimelineRepositoryQueryResult> {
    this.#assertInitialized();

    try {
      return await queryIndexedDbTimelineEvents(this.#database!, query);
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_READ_FAILED');
    }
  }

  async addEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    try {
      const record = createIndexedDbTimelineEventRecord(event, this.#now());
      const transaction = this.#database!.transaction(
        TIMELINE_INDEXEDDB_STORES.events,
        'readwrite',
      );
      transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events).put(record);
      await transaction.done;

      return { status: 'applied' };
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    }
  }

  async updateEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    try {
      const transaction = this.#database!.transaction(
        TIMELINE_INDEXEDDB_STORES.events,
        'readwrite',
      );
      const store = transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events);
      const existing = await store.get(event.id);

      if (existing === undefined) {
        await transaction.done;
        return { status: 'not-found' };
      }

      store.put(createIndexedDbTimelineEventRecord(event, this.#now()));
      await transaction.done;

      return { status: 'applied' };
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    }
  }

  async deleteEvent(
    eventId: string,
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    try {
      const transaction = this.#database!.transaction(
        TIMELINE_INDEXEDDB_STORES.events,
        'readwrite',
      );
      const store = transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events);
      const existing = await store.get(eventId);

      if (existing === undefined) {
        await transaction.done;
        return { status: 'not-found' };
      }

      store.delete(eventId);
      await transaction.done;

      return { status: 'applied' };
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    }
  }

  async replaceEvents(
    events: readonly TimelineRepositoryEvent[],
  ): Promise<TimelineRepositoryMutationResult> {
    this.#assertInitialized();

    const normalizedEvents = normalizeTimelineRepositoryEvents(events);

    try {
      const transaction = this.#database!.transaction(
        TIMELINE_INDEXEDDB_STORES.events,
        'readwrite',
      );
      const store = transaction.objectStore(TIMELINE_INDEXEDDB_STORES.events);
      await store.clear();

      for (const event of normalizedEvents) {
        store.put(createIndexedDbTimelineEventRecord(event, this.#now()));
      }

      await transaction.done;

      return { status: 'applied' };
    } catch (error) {
      if (error instanceof TimelineRepositoryError) {
        throw error;
      }

      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_WRITE_FAILED');
    }
  }

  close(): void {
    this.#connection?.close();
    this.#connection = null;
    this.#database = null;
    this.#initialized = false;
  }

  #assertInitialized(): void {
    if (!this.#initialized || this.#database === null) {
      throw new TimelineRepositoryError('TIMELINE_REPOSITORY_NOT_INITIALIZED');
    }
  }
}

export function createIndexedDbTimelineRepository(
  options: TimelineIndexedDbOpenOptions = {},
): TimelineRepository {
  return new IndexedDbTimelineRepository(options);
}
