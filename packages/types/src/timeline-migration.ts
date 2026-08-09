import type { SemanticTimelineEvent } from './semantic-timeline';
import type { TimelineEvent } from './timeline';

/**
 * Audit payload preserving the original legacy presentation fields observed
 * during a one-time lift from P2 `TimelineEvent`.
 */
export interface PreservedLegacyRaw {
  readonly title?: string;
  readonly value?: string;
  readonly unit?: string;
  readonly context?: string;
  readonly note?: string;
}

export type UnmappableReason =
  | 'unknown_unit'
  | 'unparseable_numeric'
  | 'unknown_meal_type'
  | 'ambiguous_context';

export interface UnmappableLegacyField {
  readonly field: 'title' | 'value' | 'unit' | 'context' | 'note' | 'mealType';
  readonly rawValue: string;
  readonly reason: UnmappableReason;
}

/**
 * Sidecar migration evidence for a successfully lifted legacy record.
 *
 * This type is intentionally separate from `SemanticTimelineEvent`. Retention
 * and purge policy belong to future persistence/audit architecture.
 */
export interface MigrationRecord {
  readonly eventId: string;
  readonly migratedAt: string;
  readonly migratedFrom: 'legacy_presentation';
  readonly sourceSchemaVersion: 0;
  readonly preservedLegacy: PreservedLegacyRaw;
  readonly unmappable?: readonly UnmappableLegacyField[];
}

export type QuarantineReason =
  | 'unparseable_value'
  | 'unknown_kind'
  | 'unknown_medication_unit'
  | 'invalid_numeric'
  | 'unsupported_schema';

/**
 * A legacy record that could not be lifted into the semantic application model.
 *
 * Quarantined records remain available to diagnostics and recovery flows. They
 * are excluded from the active semantic event collection.
 */
export interface QuarantineRecord {
  readonly quarantineId: string;
  readonly raw: TimelineEvent;
  readonly reason: QuarantineReason;
  readonly quarantinedAt: string;
  readonly preservedLegacy: PreservedLegacyRaw;
  readonly recoverable: boolean;
}

export type MigrationResult =
  | {
      readonly status: 'ok';
      readonly event: SemanticTimelineEvent;
      readonly migration: MigrationRecord;
    }
  | {
      readonly status: 'quarantined';
      readonly quarantine: QuarantineRecord;
    }
  | {
      readonly status: 'unsupported_schema';
      readonly raw: TimelineEvent;
      readonly detectedVersion: number;
    };

/**
 * Diagnostics snapshot for migration and quarantine state.
 *
 * Runtime collection of this snapshot is implemented in later P3 waves.
 */
export interface TimelineDiagnosticsSnapshot {
  readonly activeEventCount: number;
  readonly migrationRecordCount: number;
  readonly quarantinedCount: number;
  readonly quarantinedRecords: readonly QuarantineRecord[];
  readonly unsupportedSchemaCount: number;
}
