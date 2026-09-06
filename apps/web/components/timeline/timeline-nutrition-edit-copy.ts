import type { LocalizationPlatform } from '@diabetes-universe/i18n';

import type { NutritionTimelineEditCopy } from '../../lib/medical/nutrition/nutrition-timeline-edit-model';
import { resolveTimelineUiLabels } from './timeline-ui-labels';

export function resolveTimelineNutritionEditCopy(
  localization: LocalizationPlatform,
): NutritionTimelineEditCopy {
  const errors =
    resolveTimelineUiLabels(localization).detail.form.nutrition.errors;

  return {
    errors: {
      carbsPrecision: errors.carbsPrecision,
      carbsRange: errors.carbsRange,
      dateRequired: errors.dateRequired,
      itemCarbs: errors.itemCarbs,
      itemNameRequired: errors.itemNameRequired,
      mealTypeRequired: errors.mealTypeRequired,
      timeRequired: errors.timeRequired,
    },
  };
}
