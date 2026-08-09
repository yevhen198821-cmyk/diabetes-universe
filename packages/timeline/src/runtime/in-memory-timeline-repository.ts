import {
  TimelineRepositoryError,
  type TimelineRepository,
  type TimelineRepositoryEvent,
  type TimelineRepositoryMutationResult,
  type TimelineRepositorySnapshot,
} from '../contracts/timeline-repository';
import {
  cloneTimelineRepositoryEvents,
  normalizeTimelineRepositoryEvents,
} from './timeline-event-normalization';

export interface InMemoryTimelineRepositoryOptions {
  readonly seedEvents?: readonly TimelineRepositoryEvent[];
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
