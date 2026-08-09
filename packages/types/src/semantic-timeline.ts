import type { NutritionEntryMode } from './quick-add';
import type { TimelineEventSource } from './timeline';

/**
 * P3 canonical schema generation.
 *
 * Increment only when a breaking semantic payload change requires a new
 * migrator. Non-breaking optional field additions may remain on the same
 * version when existing readers can ignore them safely.
 */
export type TimelineEventSchemaVersion = 1;

/**
 * Canonical unit identifiers for P3 implemented event categories.
 *
 * Display conversion (for example mmol/L to mg/dL) belongs to the presentation
 * layer and must not introduce additional persisted unit identifiers in P3.
 */
export type CanonicalUnitId =
  | 'glucose.mmol_per_l'
  | 'insulin.international_unit'
  | 'mass.g'
  | 'mass.mg'
  | 'volume.ml'
  | 'duration.second';

export type GlucoseMeasurementContext =
  'fasting' | 'before_meal' | 'after_meal' | 'bedtime' | 'other';

export type NutritionMealType =
  'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

/**
 * Product line captured on a nutrition event at the time of entry.
 */
export interface NutritionProductSnapshot {
  readonly productId: string;
  readonly productName: string;
  readonly weightGrams: number;
  readonly carbsPer100Grams: number;
  readonly calculatedCarbsGrams: number;
}

/**
 * Intentional source attribution for a timeline event.
 *
 * This is not a container for legacy migration artifacts. Unmappable legacy
 * values belong in `MigrationRecord.preservedLegacy`, not here.
 */
export interface EventProvenance {
  readonly label?: string;
  readonly externalRef?: string;
}

/**
 * Shared envelope fields present on every semantic timeline event variant.
 *
 * `ownerId` and other persistence-envelope fields from ADR-0014 intentionally
 * do not appear here. Ownership belongs to a future `TimelinePersistenceRecord`
 * wrapper around the semantic domain event.
 */
export interface SemanticEventEnvelope {
  readonly id: string;

  /**
   * ISO 8601 timestamp of the medical occurrence (measurement, dose, meal, etc.).
   *
   * This is the semantic event time used for sorting, grouping, and clinical
   * context. It is not a server audit timestamp.
   */
  readonly occurredAt: string;

  /**
   * ISO 8601 timestamp of when the record first entered the local system.
   *
   * Immutable after creation. This is client-local lifecycle metadata, not a
   * server audit timestamp.
   */
  readonly createdAt: string;

  /**
   * ISO 8601 timestamp of the last local mutation to this record.
   *
   * Equals `createdAt` on initial creation. This is client-local lifecycle
   * metadata, not a server audit timestamp.
   */
  readonly updatedAt: string;

  readonly schemaVersion: TimelineEventSchemaVersion;
  readonly source: TimelineEventSource;
  readonly provenance?: EventProvenance;
}

export interface GlucoseTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'glucose';
  /** Canonical glucose concentration stored as mmol/L. */
  readonly concentrationMmolPerL: number;
  readonly context?: GlucoseMeasurementContext;
}

export interface InsulinTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'insulin';
  readonly preparation: string;
  /** Canonical insulin dose in international units. */
  readonly doseUnits: number;
  readonly context?: string;
}

export interface NutritionTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'nutrition';
  readonly mode: NutritionEntryMode;
  readonly mealType: NutritionMealType | string;
  /** Canonical carbohydrate mass in grams. */
  readonly carbohydratesGrams: number;
  readonly products?: readonly NutritionProductSnapshot[];
  readonly note?: string;
}

export interface MedicationTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'medication';
  readonly medicationId?: string;
  readonly medicationName: string;
  readonly dose: number;
  readonly doseUnit: CanonicalUnitId;
  readonly context?: string;
  readonly note?: string;
}

export interface ActivityTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'activity';
  readonly activityType: string;
  /** Canonical duration stored in seconds. */
  readonly durationSeconds: number;
  readonly note?: string;
}

export interface NoteTimelineEvent extends SemanticEventEnvelope {
  readonly kind: 'note';
  readonly title?: string;
  readonly body: string;
}

/**
 * Canonical semantic timeline event model for application and domain logic.
 *
 * `TimelineRepository` stores `SemanticTimelineEvent` natively. Legacy
 * `TimelineEvent` is retained in `@diabetes-universe/types` for migration and
 * import compatibility only. Presentation strings must not be treated as
 * canonical medical data once an event is represented by this model.
 */
export type SemanticTimelineEvent =
  | GlucoseTimelineEvent
  | InsulinTimelineEvent
  | NutritionTimelineEvent
  | MedicationTimelineEvent
  | ActivityTimelineEvent
  | NoteTimelineEvent;
