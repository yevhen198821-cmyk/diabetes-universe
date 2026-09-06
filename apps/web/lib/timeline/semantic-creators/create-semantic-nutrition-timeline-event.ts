import type {
  NutritionQuickAddEntry,
  NutritionTimelineEventV2,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

/**
 * Builds one canonical Nutrition v2 event from a Wave 5B Quick Add entry.
 *
 * Meal type is already a closed identifier. Legacy `mode`, `products`, and
 * `calculatedCarbsGrams` are never written.
 */
export function createSemanticNutritionTimelineEvent(
  entry: NutritionQuickAddEntry,
  options: {
    readonly clientUuid?: string;
    readonly clock?: SemanticTimelineClock;
    readonly id?: string;
    readonly referenceDate?: Date;
  } = {},
): NutritionTimelineEventV2 {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const note = entry.note?.trim();
  const id =
    options.id ??
    createSemanticTimelineEventId('nutrition', entry.time, options.clientUuid);

  return {
    carbohydratesGrams: entry.carbohydratesGrams,
    createdAt: now,
    id,
    kind: 'nutrition',
    mealType: entry.mealType,
    ...(entry.items === undefined ? {} : { items: entry.items }),
    note: note || undefined,
    occurredAt,
    schemaVersion: 2,
    source: 'manual',
    updatedAt: now,
  };
}
