import type {
  GlucoseMeasurementContext,
  InsulinAdministrationContext,
  InsulinPreparationId,
  NutritionItemSnapshot,
  NutritionMealType,
} from './semantic-timeline';

/**
 * MVP categories available in the first Quick Add stage.
 * Aligns with user-created EventCard types.
 */
export type QuickAddCategory =
  'glucose' | 'insulin' | 'nutrition' | 'activity' | 'medication' | 'note';

export interface QuickAddAction {
  readonly id: string;
  readonly category: QuickAddCategory;
  readonly label: string;
  readonly addTitle: string;
  readonly description: string;
}

export interface GlucoseQuickAddEntry {
  readonly valueMmol: number;
  readonly time: string;
  readonly context?: GlucoseMeasurementContext;
}

/**
 * Semantic insulin Quick Add write (Wave 4C).
 *
 * `preparationId` is the only identity; `preparation` is the display snapshot
 * resolved together with it (a catalogue label, or the user-entered name for
 * `insulin.prep.other`). The legacy free-text `context` string is not part of
 * this contract — administration context is always a semantic ID.
 */
export interface InsulinQuickAddEntry {
  readonly preparationId: InsulinPreparationId;
  readonly preparation: string;
  readonly doseUnits: number;
  readonly administrationContext: InsulinAdministrationContext;
  readonly time: string;
}

export type NutritionEntryMode = 'manual' | 'products';

/**
 * Legacy product line used by Nutrition v1 history. New Quick Add writes
 * do not emit this shape.
 */
export interface NutritionProductEntry {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly weightGrams: number;
  readonly carbsPer100Grams: number;
  readonly calculatedCarbsGrams: number;
}

/**
 * Canonical Nutrition Quick Add write (Wave 5B).
 *
 * `mealType` is a closed identifier. `mode` and `products` are not part of
 * this contract — itemized lines use `items` snapshots.
 */
export interface NutritionQuickAddEntry {
  readonly mealType: NutritionMealType;
  readonly carbohydratesGrams: number;
  readonly time: string;
  readonly note?: string;
  readonly items?: readonly NutritionItemSnapshot[];
}

export interface MedicationReference {
  readonly id: string;
  readonly name: string;
}

export interface MedicationQuickAddEntry {
  readonly medication: MedicationReference;
  readonly dose: number;
  readonly unit: string;
  readonly time: string;
  readonly context?: string;
  readonly note?: string;
}

export interface ActivityQuickAddEntry {
  readonly activityType: string;
  readonly durationMinutes: number;
  readonly time: string;
  readonly note?: string;
}

export interface NoteQuickAddEntry {
  readonly title?: string;
  readonly text: string;
  readonly time: string;
}
