import type {
  SemanticTimelineEvent,
  TimelineEventKind,
} from '@diabetes-universe/types';

/**
 * Canonical semantic repository boundary.
 *
 * The repository stores `SemanticTimelineEvent` records natively. Legacy
 * `TimelineEvent` remains migration/import-only.
 */
export type TimelineRepositoryEvent = SemanticTimelineEvent;

export interface TimelineRepositorySnapshot {
  readonly events: readonly TimelineRepositoryEvent[];
}

export type TimelineRepositoryMutationStatus = 'applied' | 'not-found';

export interface TimelineRepositoryMutationResult {
  readonly status: TimelineRepositoryMutationStatus;
}

export type TimelineRepositoryOrder = 'occurredAt-asc' | 'occurredAt-desc';

export interface TimelineRepositoryQuery {
  readonly occurredFrom?: string;
  readonly occurredTo?: string;
  readonly kinds?: readonly TimelineEventKind[];
  readonly order: TimelineRepositoryOrder;
  readonly limit: number;
  readonly cursor?: string;
}

export interface TimelineRepositoryQueryResult {
  readonly events: readonly TimelineRepositoryEvent[];
  readonly nextCursor?: string;
}

export type TimelineRepositoryErrorCode =
  | 'TIMELINE_REPOSITORY_INITIALIZE_FAILED'
  | 'TIMELINE_REPOSITORY_NOT_INITIALIZED'
  | 'TIMELINE_REPOSITORY_READ_FAILED'
  | 'TIMELINE_REPOSITORY_WRITE_FAILED'
  | 'TIMELINE_REPOSITORY_STORAGE_UNAVAILABLE'
  | 'TIMELINE_REPOSITORY_STORAGE_OPEN_BLOCKED'
  | 'TIMELINE_REPOSITORY_STORAGE_QUOTA_EXCEEDED'
  | 'TIMELINE_REPOSITORY_SCHEMA_UPGRADE_FAILED'
  | 'TIMELINE_REPOSITORY_INVALID_CURSOR'
  | 'TIMELINE_REPOSITORY_QUARANTINE_FAILED'
  | 'TIMELINE_REPOSITORY_BOOTSTRAP_INCONSISTENT';

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
  /** Initializes the repository. */
  initialize(): Promise<void>;

  /**
   * Transitional full-history compatibility surface.
   *
   * Durable Web initialization must not preload full history merely to satisfy
   * this synchronous method. Routine product reads migrate to `getById()` and
   * `queryEvents()` during P4.
   */
  getSnapshot(): TimelineRepositorySnapshot;

  getById(eventId: string): Promise<TimelineRepositoryEvent | null>;

  /**
   * Returns a deterministic bounded chronological page.
   *
   * `limit` is mandatory. Implementations must reject invalid/unbounded limits
   * and incompatible cursors rather than silently widening the read.
   */
  queryEvents(
    query: TimelineRepositoryQuery,
  ): Promise<TimelineRepositoryQueryResult>;

  addEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult>;

  updateEvent(
    event: TimelineRepositoryEvent,
  ): Promise<TimelineRepositoryMutationResult>;

  deleteEvent(eventId: string): Promise<TimelineRepositoryMutationResult>;

  /** Transitional hydration/testing capability only. */
  replaceEvents(
    events: readonly TimelineRepositoryEvent[],
  ): Promise<TimelineRepositoryMutationResult>;
}
