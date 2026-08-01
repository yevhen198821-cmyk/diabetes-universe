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
