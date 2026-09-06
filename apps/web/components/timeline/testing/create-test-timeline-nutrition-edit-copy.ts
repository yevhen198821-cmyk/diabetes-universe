import type { NutritionTimelineEditCopy } from '../../../lib/medical/nutrition/nutrition-timeline-edit-model';

export function createTestTimelineNutritionEditCopy(): NutritionTimelineEditCopy {
  return {
    errors: {
      carbsPrecision: 'Enter at most two decimal places.',
      carbsRange: 'Enter carbohydrates greater than 0 and no more than 500.',
      dateRequired: 'Enter a date.',
      itemCarbs: 'Enter valid item carbohydrates.',
      itemNameRequired: 'Enter the food name.',
      mealTypeRequired: 'Choose a meal type.',
      timeRequired: 'Enter a time.',
    },
  };
}
