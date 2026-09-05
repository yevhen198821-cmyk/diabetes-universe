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

/**
 * Stable internal catalogue-entry key for one governed insulin preparation.
 *
 * This is never a localized display label. Unmatched historical events omit
 * the field. `insulin.prep.unmapped` is not a catalogue identity.
 */
export type InsulinPreparationId =
  | 'insulin.prep.aspart_novorapid'
  | 'insulin.prep.aspart_fiasp'
  | 'insulin.prep.lispro_humalog'
  | 'insulin.prep.glulisine_apidra'
  | 'insulin.prep.glargine_lantus'
  | 'insulin.prep.degludec_tresiba'
  | 'insulin.prep.other';

/**
 * Semantic administration-context identifier for an insulin event.
 *
 * Optional on the event type so legacy rows remain readable. New semantic
 * writers always set a value (`unspecified` when the user chooses none).
 */
export type InsulinAdministrationContext =
  | 'before_meal'
  | 'after_meal'
  | 'correction'
  | 'basal'
  | 'other'
  | 'unspecified';

export type NutritionMealType =
  'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other' | 'unspecified';

/**
 * Product line captured on a legacy Nutrition v1 event at the time of entry.
 */
export interface NutritionProductSnapshot {
  readonly productId: string;
  readonly productName: string;
  readonly weightGrams: number;
  readonly carbsPer100Grams: number;
  readonly calculatedCarbsGrams: number;
}

/**
 * Historical item snapshot on a canonical Nutrition v2 event.
 *
 * `itemId` is an opaque in-record identity. It is not a food-catalogue key.
 */
export interface NutritionItemSnapshot {
  readonly itemId: string;
  readonly name: string;
  readonly carbohydratesGrams: number;
  readonly weightGrams?: number;
  readonly carbsPer100Grams?: number;
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
  /** Legacy free/localized administration string. Read-compatible only. */
  readonly context?: string;
  /**
   * Catalogue entry ID when the preparation is a known catalogue selection
   * or Other. Omitted on unmatched historical events.
   */
  readonly preparationId?: InsulinPreparationId;
  /**
   * Semantic administration context. Optional so legacy events type-check.
   * Required on new semantic writes.
   */
  readonly administrationContext?: InsulinAdministrationContext;
}

/**
 * Persisted Nutrition v1 event. Existing history stays on this shape.
 */
export interface NutritionTimelineEventV1 extends SemanticEventEnvelope {
  readonly kind: 'nutrition';
  readonly mode: NutritionEntryMode;
  readonly mealType: NutritionMealType | string;
  /** Canonical carbohydrate mass in grams. */
  readonly carbohydratesGrams: number;
  readonly products?: readonly NutritionProductSnapshot[];
  readonly note?: string;
}

/**
 * Canonical Nutrition v2 event written by Wave 5B Quick Add.
 *
 * Envelope `schemaVersion` is overridden so other kinds stay on generation 1.
 */
export interface NutritionTimelineEventV2 extends Omit<
  SemanticEventEnvelope,
  'schemaVersion'
> {
  readonly kind: 'nutrition';
  readonly schemaVersion: 2;
  readonly mealType: NutritionMealType;
  readonly carbohydratesGrams: number;
  readonly items?: readonly NutritionItemSnapshot[];
  readonly note?: string;
}

export type NutritionTimelineEvent =
  NutritionTimelineEventV1 | NutritionTimelineEventV2;

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
