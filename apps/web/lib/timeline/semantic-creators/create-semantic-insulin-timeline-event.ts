import type {
  InsulinQuickAddEntry,
  InsulinTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticInsulinTimelineEvent(
  entry: InsulinQuickAddEntry,
  options: {
    readonly clock?: SemanticTimelineClock;
    readonly referenceDate?: Date;
  } = {},
): InsulinTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const context = entry.context?.trim();

  return {
    context: context || undefined,
    createdAt: now,
    doseUnits: entry.doseUnits,
    id: createSemanticTimelineEventId('insulin', entry.time),
    kind: 'insulin',
    occurredAt,
    preparation: entry.preparation.trim(),
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
