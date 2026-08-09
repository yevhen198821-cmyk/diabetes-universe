/**
 * Shared, platform-agnostic type contracts belong in this package.
 *
 * Domain types will be introduced only when their product requirements and
 * ownership boundaries are defined.
 */
export type Brand<TValue, TBrand extends string> = TValue & {
  readonly __brand: TBrand;
};

export type {
  ActivityTimelineEvent,
  CanonicalUnitId,
  EventProvenance,
  GlucoseMeasurementContext,
  GlucoseTimelineEvent,
  InsulinTimelineEvent,
  MedicationTimelineEvent,
  NoteTimelineEvent,
  NutritionMealType,
  NutritionProductSnapshot,
  NutritionTimelineEvent,
  SemanticEventEnvelope,
  SemanticTimelineEvent,
  TimelineEventSchemaVersion,
} from './semantic-timeline';
export type {
  DaySummary,
  LastGlucose,
  NextStep,
  NextStepActionType,
  NextStepPriority,
  NextStepSource,
  TimelineEvent,
  TimelineEventKind,
  TimelineEventSource,
} from './timeline';
export type {
  MigrationRecord,
  MigrationResult,
  PreservedLegacyRaw,
  QuarantineRecord,
  QuarantineReason,
  TimelineDiagnosticsSnapshot,
  UnmappableLegacyField,
  UnmappableReason,
} from './timeline-migration';
export type {
  ActivityQuickAddEntry,
  GlucoseQuickAddEntry,
  InsulinQuickAddEntry,
  MedicationQuickAddEntry,
  MedicationReference,
  NoteQuickAddEntry,
  NutritionEntryMode,
  NutritionProductEntry,
  NutritionQuickAddEntry,
  QuickAddAction,
  QuickAddCategory,
} from './quick-add';
