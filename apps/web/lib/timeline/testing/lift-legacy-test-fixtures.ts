import type {
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';

import { liftRepositorySnapshot } from '../migration/lift-repository-snapshot';

const TEST_MIGRATED_AT = '2026-08-09T08:30:00.000Z';

/**
 * Lifts legacy timeline fixtures into semantic events for application tests.
 *
 * Throws when a fixture cannot migrate cleanly so test data issues are visible
 * instead of silently weakening migration rules.
 */
export function liftLegacyTestFixtures(
  legacyEvents: readonly TimelineEvent[],
): SemanticTimelineEvent[] {
  const lifted = liftRepositorySnapshot(legacyEvents, {
    migratedAt: TEST_MIGRATED_AT,
  });

  if (lifted.quarantinedRecords.length > 0) {
    throw new Error(
      `Test fixture lift quarantined ${lifted.quarantinedRecords.length} event(s): ${lifted.quarantinedRecords
        .map((record) => record.raw.id)
        .join(', ')}`,
    );
  }

  return [...lifted.events];
}

export function liftLegacyTestFixture(
  event: TimelineEvent,
): SemanticTimelineEvent {
  const [lifted] = liftLegacyTestFixtures([event]);

  return lifted;
}
