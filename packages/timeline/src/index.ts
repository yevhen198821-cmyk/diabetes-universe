/**
 * Timeline domain/repository package.
 *
 * ADR-0014 and ADR-0015 govern the local-first persistence direction. This
 * package remains platform-neutral; Web IndexedDB implementation belongs in
 * `@diabetes-universe/timeline-web`.
 */

export {
  TimelineRepositoryError,
  type TimelineRepository,
  type TimelineRepositoryErrorCode,
  type TimelineRepositoryEvent,
  type TimelineRepositoryMutationResult,
  type TimelineRepositoryMutationStatus,
  type TimelineRepositoryOrder,
  type TimelineRepositoryQuery,
  type TimelineRepositoryQueryResult,
  type TimelineRepositorySnapshot,
} from './contracts/timeline-repository';
export {
  liftLegacyToSemantic,
  type LiftLegacyMigrationContext,
} from './migration';
export {
  createInMemoryTimelineRepository,
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_LIMIT,
  IN_MEMORY_TIMELINE_REPOSITORY_MAX_QUERY_SCAN,
  InMemoryTimelineRepository,
  type InMemoryTimelineRepositoryOptions,
} from './runtime/in-memory-timeline-repository';
export {
  cloneTimelineRepositoryEvent,
  cloneTimelineRepositoryEvents,
  normalizeTimelineRepositoryEvents,
} from './runtime/timeline-event-normalization';
