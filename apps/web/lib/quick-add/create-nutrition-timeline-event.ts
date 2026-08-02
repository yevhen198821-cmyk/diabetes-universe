import type {
  NutritionQuickAddEntry,
  TimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline/timeline-date-time';
import { formatNutritionCarbs } from './format-nutrition';

export function createNutritionTimelineEvent(
  entry: NutritionQuickAddEntry,
): TimelineEvent {
  const carbohydrates = formatNutritionCarbs(entry.carbohydratesGrams);
  const note = entry.note?.trim();
  const dateTime = createIsoDateTimeFromLocalTime(entry.time);

  return {
    context:
      entry.mode === 'manual' ? 'Введено вручную' : 'Рассчитано по продуктам',
    dateTime,
    id: `nutrition-${entry.time.replace(':', '')}-${crypto.randomUUID()}`,
    kind: 'nutrition',
    note: note || undefined,
    source: 'manual',
    title: entry.mealType,
    value: `${carbohydrates} г углеводов`,
  };
}
