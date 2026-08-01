import type {
  NutritionQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { formatNutritionCarbs } from './format-nutrition';

export function createNutritionTimelineEvent(
  entry: NutritionQuickAddEntry,
): TimelineEvent {
  const carbohydrates = formatNutritionCarbs(entry.carbohydratesGrams);
  const note = entry.note?.trim();

  return {
    context:
      entry.mode === 'manual' ? 'Введено вручную' : 'Рассчитано по продуктам',
    id: `nutrition-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'nutrition',
    note: note || undefined,
    time: entry.time,
    title: entry.mealType,
    value: `${carbohydrates} г углеводов`,
  };
}
