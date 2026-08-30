import type {
  GlucoseQuickAddEntry,
  GlucoseTimelineEvent,
} from '@diabetes-universe/types';

import { createIsoDateTimeFromLocalTime } from '../timeline-date-time';
import { createSemanticTimelineEventId } from './create-semantic-timeline-event-id';
import {
  systemSemanticTimelineClock,
  type SemanticTimelineClock,
} from './semantic-timeline-clock';

export function createSemanticGlucoseTimelineEvent(
  entry: GlucoseQuickAddEntry,
  options: {
    readonly clientUuid?: string;
    readonly clock?: SemanticTimelineClock;
    readonly id?: string;
    readonly referenceDate?: Date;
  } = {},
): GlucoseTimelineEvent {
  const clock = options.clock ?? systemSemanticTimelineClock;
  const now = clock.now().toISOString();
  const occurredAt = createIsoDateTimeFromLocalTime(
    entry.time,
    options.referenceDate ?? clock.now(),
  );
  const id =
    options.id ??
    createSemanticTimelineEventId('glucose', entry.time, options.clientUuid);
  return {
    concentrationMmolPerL: entry.valueMmol,
    context: entry.context,
    createdAt: now,
    id,
    kind: 'glucose',
    occurredAt,
    schemaVersion: 1,
    source: 'manual',
    updatedAt: now,
  };
}
