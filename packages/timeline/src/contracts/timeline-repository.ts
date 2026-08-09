import type { SemanticTimelineEvent } from '@diabetes-universe/types';

/**
 * P3h semantic repository boundary.
 *
 * The repository stores canonical `SemanticTimelineEvent` records natively.
 * Legacy `TimelineEvent` remains available in `@diabetes-universe/types` for
 * migration/import utilities only.
 */
export type TimelineRepositoryEvent = SemanticTimelineEvent;

export interface TimelineRepositorySnapshot {
  readonly events: readonly TimelineRepositoryEvent[];
}

export type TimelineRepositoryMutationStatus = 'applied' | 'not-found';

export interface TimelineRepositoryMutationResult {
  readonly status: TimelineRepositoryMutationStatus;
}

export type TimelineRepositoryErrorCode =
  | 'TIMELINE_REPOSITORY_INITIALIZE_FAILED'
  | 'TIMELINE_REPOSITORY_NOT_INITIALIZED'
  | 'TIMELINE_REPOSITORY_READ_FAILED'
  | 'TIMELINE_REPOSITORY_WRITE_FAILED';

/**
 * Repository errors expose machine-readable codes only. Localization and
 * presentation-specific messages belong to the application/UI layer.
 */
export class TimelineRepositoryError extends Error {
  readonly code: TimelineRepositoryErrorCode;

  constructor(code: TimelineRepositoryErrorCode) {
    super(code);
    this.code = code;
    this.name = 'TimelineRepositoryError';
  }
}

export interface TimelineRepository {
  /**
   * Initializes the repository and prepares the synchronous snapshot boundary.
   */
  initialize(): Promise<void>;

  /**
   * Returns the current collection after successful initialization.
   *
   * Throws `TIMELINE_REPOSITORY_NOT_INITIALIZED` before `initialize()`
   * completes successfully.
   */
  getSnapshot(): TimelineRepositorySnapshot;

  addEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult>;

  updateEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult>;

  deleteEvent(eventId: string): Promise<TimelineRepositoryMutationResult>;

  /**
   * Transitional hydration/testing capability.
   *
   * Product flows should prefer targeted mutations (`addEvent`, `updateEvent`,
   * `deleteEvent`). `replaceEvents` exists so the current application can keep a
   * collection-level hydration boundary while IndexedDB/mobile adapters are not
   * implemented.
   */
  replaceEvents(
    events: readonly TimelineRepositoryEvent[],
  ): Promise<TimelineRepositoryMutationResult>;
}
