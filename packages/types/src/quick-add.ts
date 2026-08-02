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
  readonly description: string;
}

export interface GlucoseQuickAddEntry {
  readonly valueMmol: number;
  readonly time: string;
  readonly context: string;
}

export interface InsulinQuickAddEntry {
  readonly preparation: string;
  readonly doseUnits: number;
  readonly time: string;
  readonly context?: string;
}

export type NutritionEntryMode = 'manual' | 'products';

export interface NutritionProductEntry {
  readonly id: string;
  readonly productId: string;
  readonly productName: string;
  readonly weightGrams: number;
  readonly carbsPer100Grams: number;
  readonly calculatedCarbsGrams: number;
}

export interface NutritionQuickAddEntry {
  readonly mode: NutritionEntryMode;
  readonly mealType: string;
  readonly carbohydratesGrams: number;
  readonly time: string;
  readonly note?: string;
  readonly products?: readonly NutritionProductEntry[];
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
