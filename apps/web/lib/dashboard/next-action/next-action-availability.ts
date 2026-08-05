import type { QuickAddCategory } from '@diabetes-universe/types';

/**
 * Governed Quick Add categories available to Dashboard Next Action integration.
 * Single source of truth for both availability input and mapper support checks.
 * Must not broaden beyond the existing Quick Add implementation.
 */
export const DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES = [
  'activity',
  'glucose',
  'insulin',
  'medication',
  'note',
  'nutrition',
] as const satisfies readonly QuickAddCategory[];

export type DashboardQuickAddAvailableCategory =
  (typeof DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES)[number];

export function isDashboardQuickAddCategory(
  category: QuickAddCategory,
): category is DashboardQuickAddAvailableCategory {
  return (
    DASHBOARD_QUICK_ADD_AVAILABLE_CATEGORIES as readonly QuickAddCategory[]
  ).includes(category);
}
