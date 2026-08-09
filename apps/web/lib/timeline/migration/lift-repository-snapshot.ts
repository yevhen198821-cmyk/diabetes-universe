import { liftLegacyToSemantic } from '@diabetes-universe/timeline';
import type { LiftLegacyMigrationContext } from '@diabetes-universe/timeline';
import type {
  MigrationRecord,
  QuarantineRecord,
  SemanticTimelineEvent,
  TimelineEvent,
} from '@diabetes-universe/types';

import {
  createQuarantineIndex,
  reuseMigrationRecord,
  reuseQuarantineRecord,
  type PreviousMigrationEvidenceSnapshot,
} from './reconcile-migration-evidence';

export type { PreviousMigrationEvidenceSnapshot };

export interface LiftRepositorySnapshotResult {
  readonly events: readonly SemanticTimelineEvent[];
  readonly migrationRecords: ReadonlyMap<string, MigrationRecord>;
  readonly quarantinedRecords: readonly QuarantineRecord[];
  readonly unsupportedSchemaCount: number;
}

function cloneTimelineEvent(event: TimelineEvent): TimelineEvent {
  return { ...event };
}

/**
 * Lifts a legacy repository snapshot into semantic application state.
 *
 * Partial migration failure does not abort the lift. Successfully migrated
 * records are returned alongside quarantined legacy records.
 *
 * When `previousEvidence` is provided, existing migration and quarantine
 * evidence is reused for legacy records that were already observed. Semantic
 * events are always rebuilt from the current legacy mirror.
 */
export function liftRepositorySnapshot(
  legacyEvents: readonly TimelineEvent[],
  context: LiftLegacyMigrationContext,
  previousEvidence?: PreviousMigrationEvidenceSnapshot,
): LiftRepositorySnapshotResult {
  const events: SemanticTimelineEvent[] = [];
  const migrationRecords = new Map<string, MigrationRecord>();
  const quarantinedRecords: QuarantineRecord[] = [];
  const previousQuarantineIndex = previousEvidence
    ? createQuarantineIndex(previousEvidence.quarantinedRecords)
    : undefined;
  let unsupportedSchemaCount = 0;

  for (const legacyEvent of legacyEvents) {
    const raw = cloneTimelineEvent(legacyEvent);
    const result = liftLegacyToSemantic(raw, context);

    switch (result.status) {
      case 'ok':
        events.push(result.event);
        migrationRecords.set(
          result.migration.eventId,
          reuseMigrationRecord(
            previousEvidence,
            result.migration.eventId,
            result.migration,
          ),
        );
        break;
      case 'quarantined':
        quarantinedRecords.push(
          reuseQuarantineRecord(
            previousEvidence,
            raw,
            result.quarantine,
            previousQuarantineIndex,
          ),
        );
        break;
      case 'unsupported_schema':
        unsupportedSchemaCount += 1;
        quarantinedRecords.push(
          reuseQuarantineRecord(
            previousEvidence,
            raw,
            {
              quarantineId:
                context.createQuarantineId?.(raw) ??
                `quarantine-unsupported-schema-${raw.id}`,
              preservedLegacy: {
                context: raw.context,
                note: raw.note,
                title: raw.title,
                unit: raw.unit,
                value: raw.value,
              },
              quarantinedAt: context.migratedAt,
              raw,
              reason: 'unsupported_schema',
              recoverable: true,
            },
            previousQuarantineIndex,
          ),
        );
        break;
    }
  }

  return {
    events,
    migrationRecords,
    quarantinedRecords,
    unsupportedSchemaCount,
  };
}
