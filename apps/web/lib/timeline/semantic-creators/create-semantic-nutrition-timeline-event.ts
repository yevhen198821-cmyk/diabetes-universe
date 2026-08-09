import type {
  NutritionQuickAddEntry,
  NutritionTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import { mapQuickAddNutritionMealType } from './map-quick-add-nutrition-meal-type';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticNutritionTimelineEvent(
  entry: NutritionQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): NutritionTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const note = entry.note?.trim();

  return {
    carbohydratesGrams: entry.carbohydratesGrams,
    createdAt: now,
    id: createSemanticTimelineEventId('nutrition', entry.time),
    kind: 'nutrition',
    mealType: mapQuickAddNutritionMealType(entry.mealType),
    mode: entry.mode,
    note: note || undefined,
    occurredAt,
    products: entry.products,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
