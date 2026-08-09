/**
 * Timeline Repository Foundation.
 *
 * ADR-0014 remains the architecture authority. This package defines the P2
 * repository boundary and the non-durable in-memory adapter only.
 */

export {
  TimelineRepositoryError,
  type TimelineRepository,
  type TimelineRepositoryErrorCode,
  type TimelineRepositoryEvent,
  type TimelineRepositoryMutationResult,
  type TimelineRepositoryMutationStatus,
  type TimelineRepositorySnapshot,
} from './contracts/timeline-repository';
export {
  liftLegacyToSemantic,
  type LiftLegacyMigrationContext,
} from './migration';
export {
  createInMemoryTimelineRepository,
  InMemoryTimelineRepository,
  type InMemoryTimelineRepositoryOptions,
} from './runtime/in-memory-timeline-repository';
