/**
 * MVP categories available in the first Quick Add stage.
 * Aligns with primary Timeline event kinds and EventCard types.
 */
export type QuickAddCategory = 'glucose' | 'insulin' | 'nutrition' | 'activity';

export interface QuickAddAction {
  readonly id: string;
  readonly category: QuickAddCategory;
  readonly label: string;
  readonly description: string;
}
