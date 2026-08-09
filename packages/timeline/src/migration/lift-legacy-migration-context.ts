import type { TimelineEvent } from '@diabetes-universe/types';

/**
 * Deterministic inputs supplied by the caller for legacy lift operations.
 */
export interface LiftLegacyMigrationContext {
  /** ISO 8601 timestamp recorded for the migration operation. */
  readonly migratedAt: string;
  /**
   * Optional deterministic quarantine identifier factory.
   * Defaults to `quarantine-${event.id}` when the legacy record has an id.
   */
  readonly createQuarantineId?: (raw: TimelineEvent) => string;
}
