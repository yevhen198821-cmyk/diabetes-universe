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
  DaySummary,
  LastGlucose,
  NextStep,
  TimelineEvent,
  TimelineEventKind,
  TimelineEventSource,
} from './timeline';
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
